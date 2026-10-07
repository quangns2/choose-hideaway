CREATE TABLE admins (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE reservation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  admin_id INTEGER NOT NULL REFERENCES admins(id),
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
