"""SQLite transaction and immutable record/event persistence."""
import hashlib
import json
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from uuid import uuid4
from .domain import ROOT, REF, RULE_VERSION, canonical, DomainError

class Store:
    def __init__(self,path):
        self.path=str(path)
        self.db=sqlite3.connect(self.path,isolation_level=None,timeout=10)
        self.db.row_factory=sqlite3.Row
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA busy_timeout=10000')
        self.db.execute('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)')
        for f in sorted((ROOT/'migrations').glob('*.sql')):
            version=int(f.name.split('_')[0])
            if not self.db.execute('SELECT 1 FROM schema_migrations WHERE version=?',(version,)).fetchone():
                self.db.executescript('BEGIN IMMEDIATE;\n'+f.read_text()+f"\nINSERT INTO schema_migrations VALUES({version}, datetime('now'));\nCOMMIT;")
        with self.transaction():
            rules=json.loads((ROOT/'data/program_rules.json').read_text())
            self.record('ProgramRule',RULE_VERSION,None,rules)
            from .policy_v2 import RULE,registry
            self.record('ProgramRule',RULE,None,registry())
            from .custom_plans import RULE as CUSTOM_RULE,registry as custom_registry
            self.record('ProgramRule',CUSTOM_RULE,None,custom_registry())
            self.record('QuranReferenceVersion',REF.version,None,REF.data)
            self.record('MushafPageMap',REF.data['pageMap']['version'],None,REF.data['pageMap'])
    @contextmanager
    def transaction(self):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            yield
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK'); raise
    def close(self): self.db.close()
    def record(self,kind,id,member,payload,revision=1,at=None):
        old=self.db.execute('SELECT payload FROM records WHERE kind=? AND id=? AND revision=?',(kind,id,revision)).fetchone()
        if old:
            if old[0]!=canonical(payload): raise DomainError('IMMUTABLE_RECORD_CONFLICT','A pinned record cannot change in place.',409)
            return
        self.db.execute('INSERT INTO records VALUES(?,?,?,?,?,?)',(kind,id,revision,member,canonical(payload),at or datetime.now(timezone.utc).isoformat()))
    def event(self,member,kind,id,payload,at):
        self.db.execute('INSERT INTO events(id,member_id,kind,entity_id,payload,created_at) VALUES(?,?,?,?,?,?)',(str(uuid4()),member,kind,id,canonical(payload),at))
    def events(self,member):
        return [dict(r, payload=json.loads(r['payload'])) for r in self.db.execute('SELECT * FROM events WHERE member_id=? ORDER BY sequence',(member,))]
    def member(self,id):
        r=self.db.execute('SELECT id,timezone,created_at FROM members WHERE id=?',(id,)).fetchone()
        if not r: raise DomainError('NOT_FOUND','Member not found.',404)
        return dict(r)
    def authenticate(self,token):
        h=hashlib.sha256(token.encode()).hexdigest()
        r=self.db.execute('SELECT id FROM members WHERE token_hash=?',(h,)).fetchone()
        if not r: raise DomainError('UNAUTHORIZED','A valid member bearer token is required.',401)
        return r[0]
    def create_member(self,id,tz,at):
        token=secrets.token_urlsafe(32)
        self.db.execute('INSERT INTO members VALUES(?,?,?,?)',(id,hashlib.sha256(token.encode()).hexdigest(),tz,at))
        return token
