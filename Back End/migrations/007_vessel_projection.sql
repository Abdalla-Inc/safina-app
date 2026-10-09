CREATE TABLE vessel_projections (
 member_id TEXT PRIMARY KEY REFERENCES members(id),
 revision INTEGER NOT NULL,
 input_hash TEXT NOT NULL,
 payload TEXT NOT NULL
);
