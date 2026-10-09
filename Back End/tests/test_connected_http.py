import json,tempfile,threading,unittest
from pathlib import Path
from http.client import HTTPConnection
from safina.app_api import make_server
from safina.identity import Config
from safina.store import Store

class ConnectedHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory();cls.db=Path(cls.tmp.name)/'http.db';cls.origin='http://127.0.0.1:5178'
        cls.server=make_server(cls.db,Config(b't'*48,origin=cls.origin),port=0)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.tmp.cleanup()
    def call(self,method,path,body=None,cookie=None,csrf=None,origin=None,raw=None):
        headers={}
        if body is not None or raw is not None:headers['Content-Type']='application/json';headers['Origin']=origin or self.origin
        if cookie:headers['Cookie']=cookie
        if csrf:headers['X-CSRF-Token']=csrf
        conn=HTTPConnection('127.0.0.1',self.server.server_port,timeout=10)
        conn.request(method,'/api/v1'+path,body=raw if raw is not None else (json.dumps(body) if body is not None else None),headers=headers)
        res=conn.getresponse();data=res.read();head=dict(res.getheaders());status=res.status;conn.close()
        return status,json.loads(data),head
    def login(self,email):
        status,body,_=self.call('POST','/auth/register',{'email':email,'password':'long-test-password','displayName':'قارئ اختبار','tier':'B','communityAcknowledged':True,'countryCode':'SD','istighfarGoal':100});self.assertEqual(status,200)
        with Store(self.db).db as db:code=json.loads(db.execute('SELECT payload FROM sandbox_mailbox WHERE email=? ORDER BY id DESC',(email,)).fetchone()[0])['code']
        status,session,headers=self.call('POST','/auth/verify',{'email':email,'code':code});self.assertEqual(status,200)
        return session,headers['Set-Cookie'].split(';')[0],headers
    def test_session_cookie_origin_csrf_no_bearer(self):
        session,cookie,headers=self.login('browser@safina.test')
        self.assertIn('HttpOnly',headers['Set-Cookie']);self.assertIn('SameSite=Lax',headers['Set-Cookie']);self.assertEqual(headers['Cache-Control'],'no-store')
        status,me,_=self.call('GET','/me',cookie=cookie);self.assertEqual(status,200);self.assertFalse(me['permissions']['founder'])
        self.assertEqual(self.call('GET','/me')[0],401)
        self.assertEqual(self.call('PATCH','/me',{'mutationId':'x'},cookie=cookie)[0],403)
        self.assertEqual(self.call('POST','/auth/login',{},origin='https://evil.test')[0],403)
        self.assertEqual(self.call('POST','/auth/logout',{},cookie=cookie,csrf=session['csrfToken'])[0],200)
        self.assertEqual(self.call('GET','/me',cookie=cookie)[0],401)
    def test_frontend_paths_and_role_injection(self):
        session,cookie,_=self.login('routes@safina.test')
        for path in ('/today','/me/commitment','/community/context','/community/daily','/community/weekly','/me/community/weeks','/reader','/learning/courses','/learning/library','/ship-progress','/me/export'):
            with self.subTest(path=path):self.assertEqual(self.call('GET',path,cookie=cookie)[0],200)
        self.assertEqual(self.call('GET','/moderation/reports',cookie=cookie)[0],403)
        from uuid import uuid4
        self.assertEqual(self.call('PATCH','/me',{'mutationId':str(uuid4()),'expectedRevision':1,'role':'founder'},cookie=cookie,csrf=session['csrfToken'])[0],422)
    def test_october_contract_over_http(self):
        from uuid import uuid4
        from datetime import datetime,timezone
        from safina.domain import REF
        from safina.policy_v2 import mecca_day
        session,cookie,_=self.login('october-http@safina.test')
        status,health,_=self.call('GET','/health');self.assertEqual(health['contractVersion'],'0.6.0')
        def put(path,body,method='PUT'):
            status,value,_=self.call(method,path,{'mutationId':str(uuid4()),**body},cookie=cookie,csrf=session['csrfToken']);self.assertEqual(status,200,value);return value
        now=datetime.now(timezone.utc);occ=dict(occurredAt=now.isoformat(),occurrenceDate=now.date().isoformat(),timezone='UTC',utcOffsetMinutes=0)
        group=put('/today/custom',dict(referenceVersion=REF.version,selection=dict(kind='surah',surahId=36,fromAyah=1,toAyah=20),**occ),'POST')
        self.assertEqual(group['ranges'],[{'start':'36:1','end':'36:20'}])
        dhikr=put('/today/istighfar',dict(day=mecca_day(now),expectedRevision=0,count=150,**occ));self.assertTrue(dhikr['complete'])
        status,feed,_=self.call('GET','/community/daily',cookie=cookie);card=next(x for x in feed['items'] if x['member']['id']==session['memberId'])
        reaction=put('/community/daily/'+card['id']+'/reaction',dict(expectedRevision=0,emoji='👏'));self.assertEqual(reaction['viewerReaction'],'👏')
        put('/custom-readings/'+group['groupId']+'/retract',dict(expectedRevision=1,reason='HTTP fixture cleanup'),'POST')
        self.assertEqual(self.call('GET','/ship-visual-state',cookie=cookie)[1]['status'],'ready')

    def test_duplicate_json_and_google_sandbox(self):
        self.assertEqual(self.call('POST','/auth/login',raw='{"email":"a","email":"b"}')[0],422)
        self.assertEqual(self.call('POST','/auth/google',{})[0],503)


    def test_owner_route_denial_and_google_error_redirect(self):
        from unittest.mock import patch
        from safina.domain import DomainError
        from uuid import uuid4
        session,cookie,_=self.login('launch-http@safina.test')
        self.assertEqual(self.call('GET','/admin/ship-preview',cookie=cookie)[0],403)
        body=dict(mutationId=str(uuid4()),expectedRevision=0,buildStep=30,health=100,celebration=True)
        self.assertEqual(self.call('PUT','/admin/ship-preview',body,cookie=cookie,csrf=session['csrfToken'])[0],403)
        with patch('safina.identity.Identity.google_callback',side_effect=DomainError('ONBOARDING_REQUIRED','Setup',409)):
            status,_,headers=self.call('GET','/auth/google/callback?code=one-use')
            self.assertEqual(status,303);self.assertEqual(headers['Location'],self.origin+'/?authError=ONBOARDING_REQUIRED#/account')
