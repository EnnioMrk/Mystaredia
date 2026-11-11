/**
 * Mystaredia on Cloudflare Workers.
 *
 * One Worker, one D1 database, no other bindings.
 * Static files never touch this code: `assets.run_worker_first` sends only
 * /api/* here. Everything else is served by the edge cache.
 *
 * Routes:
 *   GET  /api/pages   site list for the password gate
 *   GET  /api/chat    last 10 messages
 *   POST /api/chat    append one message (form or JSON)
 *   GET  /api/mai     proxy to the Brainshop chatbot
 */

import sites from "../data/sites.json";

const MAX_MESSAGES = 10;
const MAX_NAME = 32;
const MAX_CONTENT = 500;

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers || {}) },
  });
}

function text(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return await request.json().catch(() => ({}));
  }
  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return { name: form.get("name"), content: form.get("content") };
}

async function listMessages(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, time, name, content FROM messages ORDER BY id DESC LIMIT ?",
  )
    .bind(MAX_MESSAGES)
    .all();
  return results.reverse();
}

async function handleChat(request, env) {
  if (request.method === "GET") {
    const messages = await listMessages(env);
    const newest = messages.length ? messages[messages.length - 1].id : 0;
    const etag = `W/"${newest}-${messages.length}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: { etag } });
    }
    return json(messages, { headers: { etag, "cache-control": "no-store" } });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  }

  const body = await readBody(request);
  const content = text(body.content, MAX_CONTENT);
  const name = text(body.name, MAX_NAME) || "Anonymous";
  if (!content) return json({ error: "content is required" }, { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO messages (time, name, content) VALUES (?, ?, ?)").bind(now, name, content),
    env.DB.prepare(
      "DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY id DESC LIMIT ?)",
    ).bind(MAX_MESSAGES),
  ]);

  return json({ ok: true });
}

async function handleMai(request, env) {
  const url = new URL(request.url);
  const msg = text(url.searchParams.get("msg"), 200);
  const uid = text(url.searchParams.get("uid"), 40) || "anonymous";
  if (!msg) return json({ error: "msg is required" }, { status: 400 });

  const target = new URL("https://api.brainshop.ai/get");
  target.searchParams.set("bid", env.BRAINSHOP_BID);
  target.searchParams.set("key", env.BRAINSHOP_KEY);
  target.searchParams.set("uid", uid);
  target.searchParams.set("msg", msg);

  try {
    const upstream = await fetch(target, { cf: { cacheTtl: 0 } });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const data = await upstream.json();
    return json({ cnt: String(data.cnt ?? "") });
  } catch {
    return json({ cnt: "The chatbot service is offline right now." }, { status: 200 });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/pages") {
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET" } });
      }
      return json(sites, { headers: { "cache-control": "public, max-age=300" } });
    }

    if (pathname === "/api/chat") return handleChat(request, env);
    if (pathname === "/api/mai") return handleMai(request, env);

    return env.ASSETS.fetch(request);
  },
};
