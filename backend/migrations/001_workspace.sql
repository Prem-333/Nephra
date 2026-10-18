CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sessions (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  patient TEXT NOT NULL CHECK(json_valid(patient)),
  readings TEXT NOT NULL CHECK(json_valid(readings)),
  PRIMARY KEY(workspace_id, id)
) STRICT;
CREATE TABLE IF NOT EXISTS reviews (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  patient_id TEXT NOT NULL,
  minute REAL NOT NULL CHECK(minute BETWEEN 0 AND 1440),
  action TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(workspace_id, position)
) STRICT;
PRAGMA user_version = 1;
