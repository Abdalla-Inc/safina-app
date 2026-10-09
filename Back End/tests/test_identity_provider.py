"""Mock the official provider boundary; no external accounts or emails are created."""
import json,tempfile,unittest
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urlsplit,parse_qs
from safina.store import Store
from safina.connected import ConnectedService
from safina.identity import Config,Identity,hashed
from safina.domain import DomainError

class ProviderTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=Store(Path(self.tmp.name)/'live-adapter.db');self.s=ConnectedService(self.store,now=lambda:datetime(2026,9,30,12,tzinfo=timezone.utc));self.config=Config(b'x'*48,mode='supabase',origin='https://app.example.test',supabase_url='https://project.example.test',supabase_key='test-publishable-key')
        self.auth=Identity(self.s,self.config);self.user={'id':'provider-user-1','email':'member@example.test','email_confirmed_at':'2026-09-30T00:00:00Z'};self.calls=[]
        self.tokens={'access_token':'server-access-secret','refresh_token':'server-refresh-secret'}
        def call(method,path,body=None,access=None):
            self.calls.append((method,path,body,access))
            if path=='/user':return self.user
            return dict(self.tokens)
        self.auth.provider.call=call
        self.store.db.execute('INSERT INTO auth_invites VALUES(?,NULL,?)',(hashed(self.user['email']),self.s.timestamp()))
        self.intent={'displayName':'Test member','tier':'B','communityAcknowledged':True,'countryCode':'SD','istighfarGoal':100}
    def tearDown(self):self.store.close();self.tmp.cleanup()
    def test_google_pkce_cookie_binding_verified_identity_and_encryption(self):
        start,flow=self.auth.google_start(self.intent);q=parse_qs(urlsplit(start['url']).query)
        self.assertEqual(q['provider'],['google']);self.assertEqual(q['code_challenge_method'],['s256']);self.assertEqual(q['redirect_to'],['https://app.example.test/api/v1/auth/google/callback'])
        with self.assertRaises(DomainError):self.auth.google_callback('different-browser','auth-code')
        session,token=self.auth.google_callback(flow,'auth-code');self.assertNotIn('access_token',session)
        row=self.store.db.execute('SELECT provider_session FROM sessions').fetchone();self.assertNotIn('server-access-secret',row[0]);self.assertEqual(self.config.decrypt(row[0]),self.tokens)
        self.assertEqual(self.auth.session(token)['member_id'],session['memberId'])
        profile=self.s.me(session['memberId']);self.assertEqual(profile['countryCode'],'SD');self.assertEqual(profile['istighfarGoal'],100)
        self.assertTrue(any(path=='/token?grant_type=pkce' and body['code_verifier'] for _,path,body,_ in self.calls if body))
        with self.assertRaises(DomainError):self.auth.google_callback(flow,'auth-code')
    def test_unverified_provider_rejected(self):
        _,flow=self.auth.google_start(self.intent);self.user['email_confirmed_at']=None
        with self.assertRaises(DomainError) as e:self.auth.google_callback(flow,'auth-code')
        self.assertEqual(e.exception.code,'EMAIL_NOT_VERIFIED');self.assertFalse(self.store.db.execute('SELECT * FROM sessions').fetchall())
    def test_password_provider_login_and_refresh_subject_binding(self):
        with self.store.transaction():mid=self.auth._create_account(self.user,self.intent)
        session,token=self.auth.login({'email':self.user['email'],'password':'provider-password'})
        self.assertEqual(session['memberId'],mid);self.assertTrue(any(path=='/token?grant_type=password' for _,path,_,_ in self.calls))
        self.user['id']='different-identity'
        with self.assertRaises(DomainError):self.auth.refresh(token,session['csrfToken'])
    def test_live_origin_and_missing_invitation(self):
        with self.assertRaises(ValueError):Config(b'x'*48,mode='supabase',origin='http://public.example.test',supabase_url='https://project.example.test',supabase_key='key')
        self.store.db.execute('DELETE FROM auth_invites');_,flow=self.auth.google_start(self.intent)
        with self.assertRaises(DomainError) as e:self.auth.google_callback(flow,'code')
        self.assertEqual(e.exception.code,'INVITATION_REQUIRED')
