-- The 10 messages from the old messages.json buffer.
-- Safe to skip: delete this file before the first `db:remote` run if you want an empty chat.

INSERT OR IGNORE INTO messages (id, time, name, content) VALUES
  (5,  1636216313, 'Anonymous',   'asd'),
  (6,  1636315583, 'Anonymous',   'dsa'),
  (7,  1636398543, 'Anonymous',   'hallo'),
  (8,  1636533480, 'Antonymous',  'Hello'),
  (9,  1636533558, 'Myst',        'asd'),
  (10, 1636533561, 'Antonymous',  'ok nice'),
  (11, 1636742384, 'Anonymous',   'Hello'),
  (12, 1636742398, 'Anonymous',   'im crazy'),
  (13, 1636807619, 'Anonymous',   'hello'),
  (14, 1636807646, 'Anonymous',   'test');
