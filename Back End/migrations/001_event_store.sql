PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS members (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, timezone TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
 member_id TEXT NOT NULL REFERENCES members(id), kind TEXT NOT NULL,
 entity_id TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_member ON events(member_id, sequence);
CREATE TABLE IF NOT EXISTS mutations (
 member_id TEXT NOT NULL REFERENCES members(id), mutation_id TEXT NOT NULL,
 request_hash TEXT NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)),
 PRIMARY KEY(member_id, mutation_id)
);
CREATE TABLE IF NOT EXISTS records (
 kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision>0),
 member_id TEXT REFERENCES members(id), payload TEXT NOT NULL CHECK(json_valid(payload)),
 created_at TEXT NOT NULL, PRIMARY KEY(kind,id,revision)
);
CREATE INDEX IF NOT EXISTS records_member ON records(member_id,kind);
CREATE TRIGGER IF NOT EXISTS immutable_events_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_events_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_records_update BEFORE UPDATE ON records BEGIN SELECT RAISE(ABORT,'records are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_records_delete BEFORE DELETE ON records BEGIN SELECT RAISE(ABORT,'records are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_mutations_update BEFORE UPDATE ON mutations BEGIN SELECT RAISE(ABORT,'mutations are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_mutations_delete BEFORE DELETE ON mutations BEGIN SELECT RAISE(ABORT,'mutations are immutable'); END;
