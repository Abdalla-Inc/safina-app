CREATE TABLE accounts (
 member_id TEXT PRIMARY KEY REFERENCES members(id), provider TEXT NOT NULL, subject TEXT NOT NULL,
 email TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','deletion_requested','disabled')),
 role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','founder','moderator')),
 profile TEXT NOT NULL CHECK(json_valid(profile)), revision INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL, UNIQUE(provider,subject)
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES accounts(member_id),
 csrf_hash TEXT NOT NULL, csrf_secret TEXT NOT NULL, provider_session TEXT,
 expires_at TEXT NOT NULL, absolute_expires_at TEXT NOT NULL, created_at TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX sessions_member ON sessions(member_id);
CREATE TABLE sandbox_identities (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0);
CREATE TABLE auth_challenges (id TEXT PRIMARY KEY, subject TEXT NOT NULL, kind TEXT NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE sandbox_mailbox (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE auth_flows (id TEXT PRIMARY KEY, payload TEXT NOT NULL, expires_at TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE auth_invites (email_hash TEXT PRIMARY KEY, used_by TEXT, created_at TEXT NOT NULL);
CREATE TABLE rate_limits (bucket TEXT NOT NULL, window INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(bucket,window));
CREATE TABLE avatar_assets (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES accounts(member_id), mime TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE reader_preferences (member_id TEXT PRIMARY KEY REFERENCES accounts(member_id), payload TEXT NOT NULL, revision INTEGER NOT NULL);
CREATE TABLE community_cards (
 id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES accounts(member_id), kind TEXT NOT NULL CHECK(kind IN ('daily','weekly')),
 period TEXT NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL, source_sequence INTEGER NOT NULL,
 visible INTEGER NOT NULL, meaningful_at TEXT NOT NULL, UNIQUE(member_id,kind,period)
);
CREATE INDEX community_feed ON community_cards(kind,period,visible,meaningful_at,id);
CREATE TABLE community_outbox (
 cursor INTEGER PRIMARY KEY AUTOINCREMENT, event_key TEXT UNIQUE NOT NULL, kind TEXT NOT NULL,
 target_id TEXT, member_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE reactions (
 member_id TEXT NOT NULL REFERENCES accounts(member_id), target_id TEXT NOT NULL REFERENCES community_cards(id),
 reacted INTEGER NOT NULL CHECK(reacted IN (0,1)), revision INTEGER NOT NULL,
 PRIMARY KEY(member_id,target_id)
);
CREATE TABLE feed_snapshots (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, scope TEXT NOT NULL, payload TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE community_reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL REFERENCES accounts(member_id), target_id TEXT NOT NULL REFERENCES community_cards(id), reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL);
CREATE TABLE moderation_actions (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, target_id TEXT NOT NULL, action TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE hidden_cards (target_id TEXT PRIMARY KEY REFERENCES community_cards(id), reason TEXT NOT NULL);
CREATE TABLE content_courses (id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, published INTEGER NOT NULL, PRIMARY KEY(id,version));
CREATE TABLE content_library (id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, published INTEGER NOT NULL, PRIMARY KEY(id,version));
CREATE TABLE enrollments (member_id TEXT NOT NULL REFERENCES accounts(member_id), course_id TEXT NOT NULL, status TEXT NOT NULL, expires_at TEXT, PRIMARY KEY(member_id,course_id));
CREATE TABLE learning_records (member_id TEXT NOT NULL REFERENCES accounts(member_id), course_id TEXT NOT NULL, kind TEXT NOT NULL, entity_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(member_id,course_id,kind,entity_id));
CREATE TABLE learning_history (sequence INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, course_id TEXT NOT NULL, kind TEXT NOT NULL, entity_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE lifecycle_requests (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
