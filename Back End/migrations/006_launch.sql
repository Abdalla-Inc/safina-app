CREATE TABLE admin_ship_previews (
 member_id TEXT PRIMARY KEY REFERENCES members(id),
 revision INTEGER NOT NULL,
 payload TEXT NOT NULL
);
