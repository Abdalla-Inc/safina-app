-- Existing hearts migrate once; the migration ledger prevents double application.
ALTER TABLE reactions ADD COLUMN emoji TEXT CHECK (emoji IS NULL OR emoji IN ('❤️','👏','🤲','👍','🔥'));
UPDATE reactions SET emoji='❤️' WHERE reacted=1;
CREATE TABLE istighfar_days (
 member_id TEXT NOT NULL REFERENCES accounts(member_id), day TEXT NOT NULL,
 payload TEXT NOT NULL, revision INTEGER NOT NULL, PRIMARY KEY(member_id,day)
);
