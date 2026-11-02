CREATE TABLE rr_users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rr_progress (
  user_id TEXT PRIMARY KEY REFERENCES rr_users(id),
  document JSONB NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
