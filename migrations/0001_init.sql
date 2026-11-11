-- Mystaredia chat buffer. Keeps the newest 10 rows only.

CREATE TABLE IF NOT EXISTS messages (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  time    INTEGER NOT NULL,
  name    TEXT    NOT NULL,
  content TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_id_desc ON messages (id DESC);
