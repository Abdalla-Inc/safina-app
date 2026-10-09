import json,tempfile,unittest
from datetime import datetime,timezone,timedelta
from pathlib import Path
from uuid import uuid4
from safina.store import Store
from safina.connected import ConnectedService
from safina.identity import Identity,Config
from safina.community import Community
from safina.activity import selection_ranges,COUNTRIES
from safina.domain import REF,DomainError

class OctoberTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=Store(Path(self.tmp.name)/'db');self.at=datetime(2026,10,1,8,tzinfo=timezone.utc)
        self.s=ConnectedService(self.store,now=lambda:self.at,signing_key=b'x'*48);self.auth=Identity(self.s,Config(b'x'*48))
        self.auth.register(dict(email='october@example.test',password='safe-test-password',displayName='قارئ بدون صورة',tier='B',communityAcknowledged=True,countryCode='sd',istighfarGoal=100))
        self.mid=self.store.db.execute('SELECT member_id FROM accounts').fetchone()[0];self.c=Community(self.s)
    def tearDown(self):self.store.close();self.tmp.cleanup()
    def write(self,name,body,fn):
        body={'mutationId':str(uuid4()),**body};return self.s.atomic(self.mid,name,body,lambda:fn(self.mid,body))
    def occurrence(self):return dict(occurredAt=self.at.isoformat(),occurrenceDate=self.at.date().isoformat(),timezone='UTC',utcOffsetMinutes=0)
    def custom(self,selection):return self.write('custom',dict(referenceVersion=REF.version,selection=selection,**self.occurrence()),self.s.custom)
    def dhikr(self,count,revision=0,day=None):return self.write('istighfar',dict(count=count,expectedRevision=revision,day=day or self.s.context()['day'],**self.occurrence()),self.s.istighfar_put)
    def test_country_required_normalized_existing_setup(self):
        self.assertEqual(len(COUNTRIES),249);me=self.s.me(self.mid);self.assertEqual(me['countryCode'],'SD');self.assertEqual(me['istighfarGoal'],100);self.assertEqual(me['setupStatus'],'complete')
        for country in ('XX',None,'🇸🇩'):
            with self.assertRaises(DomainError):self.write('profile',dict(expectedRevision=1,countryCode=country),self.s.profile_update)
        p=json.loads(self.s.account(self.mid)['profile']);p.pop('countryCode');p.pop('istighfarGoal');self.store.db.execute('UPDATE accounts SET profile=? WHERE member_id=?',(json.dumps(p),self.mid))
        self.assertEqual(self.s.me(self.mid)['setupStatus'],'required');self.assertIsNone(self.s.me(self.mid)['countryCode'])
    def test_custom_unrelated_participates_without_credit(self):
        out=self.custom(dict(kind='surah',surahId=36,fromAyah=1,toAyah=20));self.assertEqual(out['today']['evaluation']['status'],'supplemental_only')
        feed=self.c.feed(self.mid,'daily','2026-10-01');self.assertEqual(feed['completeWirdMemberCount'],0);self.assertEqual(len(feed['items']),1)
        self.assertEqual(feed['items'][0]['facts'][0]['kind'],'custom_reading');self.assertNotIn('email',feed['items'][0]['member'])
        card=feed['items'][0];before_cursor=self.c.cursor();self.write('profile',dict(expectedRevision=1,countryCode='AU'),self.s.profile_update)
        new=self.c.feed(self.mid,'daily','2026-10-01')['items'][0];self.assertEqual(new['member']['countryCode'],'AU');self.assertEqual(new['meaningfulAt'],card['meaningfulAt']);self.assertEqual(new['revision'],card['revision'])
        self.assertTrue(any(x['card'] and x['card']['member']['countryCode']=='AU' for x in self.c.changes(self.mid,before_cursor)['changes']))
    def test_juz_partition_overlap_receipt_and_atomic_correction(self):
        first=selection_ranges(dict(kind='juz',**{'from':1,'to':1}));self.assertEqual(first,[{'start':'1:1','end':'1:7'},{'start':'2:1','end':'2:141'}])
        parts=[REF.juz(j) for j in range(1,31)];self.assertEqual(sum(map(len,parts)),6236);self.assertEqual(frozenset().union(*parts),REF.all)
        body=dict(mutationId=str(uuid4()),referenceVersion=REF.version,selection=dict(kind='juz',**{'from':1,'to':1}),**self.occurrence())
        out=self.s.atomic(self.mid,'custom',body,lambda:self.s.custom(self.mid,body));self.assertEqual(self.s.atomic(self.mid,'custom',body,lambda:None),out)
        self.custom(body['selection']);self.assertEqual(self.s.today(self.mid)['evaluation']['uniqueVerseCount'],148)
        corrected=self.write('correct',dict(expectedRevision=1,referenceVersion=REF.version,ranges=[{'start':'1:1','end':'1:7'}],reason='Corrected report'),lambda m,b:self.s.custom_correct(m,out['groupId'],b))
        self.assertFalse(corrected['selectionIntact']);self.assertEqual(corrected['revision'],2)
        with self.assertRaises(DomainError):self.write('correct',dict(expectedRevision=1,reason='stale'),lambda m,b:self.s.custom_correct(m,out['groupId'],b,True))
    def test_reopening_assigned_preserves_custom_other_surahs(self):
        out=self.custom(dict(kind='juz',**{'from':1,'to':3}));today=self.s.today(self.mid)
        self.assertEqual(today['componentStates'][0]['status'],'completed')
        self.write('component',dict(assignmentId=today['assignment']['id'],expectedInputHash=today['evaluation']['inputHash'],completed=False),lambda m,b:self.s.component(m,'B',b))
        act=self.s.state(self.mid)['acts'][out['actId']];self.assertFalse(REF.b & REF.coverage(act['ranges']));self.assertIn(REF.index('1:1'),REF.coverage(act['ranges']));self.assertIn(REF.index('3:1'),REF.coverage(act['ranges']))
        self.assertFalse(self.s.custom_view(act)['selectionIntact'])
    def test_custom_removal_preserves_independent_assigned_report(self):
        today=self.s.today(self.mid);self.write('component',dict(assignmentId=today['assignment']['id'],expectedInputHash=today['evaluation']['inputHash'],completed=True,**self.occurrence()),lambda m,b:self.s.component(m,'B',b))
        out=self.custom(dict(kind='juz',**{'from':1,'to':3}));self.write('retract',dict(expectedRevision=1,reason='undo custom'),lambda m,b:self.s.custom_correct(m,out['groupId'],b,True))
        self.assertEqual(self.s.today(self.mid)['evaluation']['status'],'completed')
    def test_istighfar_absolute_pinned_goal_zero_and_conflict(self):
        one=self.dhikr(50);self.assertFalse(one['complete']);self.assertEqual(one['target'],100)
        self.write('goal',dict(expectedRevision=1,istighfarGoal=200),self.s.goal_put)
        two=self.dhikr(150,1);self.assertTrue(two['complete']);self.assertEqual(two['target'],100)
        same=self.dhikr(150,2);self.assertEqual(same['revision'],2)
        w=self.c.feed(self.mid,'weekly','2026-09-27')['items'][0];self.assertEqual((w['readingDays'],w['activityDays'],w['istighfarTotal']),(0,1,150))
        self.assertEqual(self.c.feed(self.mid,'daily','2026-10-01')['completeWirdMemberCount'],0);self.assertFalse(self.s.state(self.mid)['acts'])
        with self.assertRaises(DomainError):self.dhikr(12,1)
        zero=self.dhikr(0,2);self.assertFalse(zero['complete']);self.assertEqual(zero['target'],100);self.assertEqual(self.c.feed(self.mid,'daily','2026-10-01')['items'],[])
        self.assertEqual(self.c.own_weeks(self.mid)['items'][0]['istighfarTotal'],0)
        self.at+=timedelta(days=1);self.assertEqual(self.dhikr(50)['target'],200)
    def test_midnight_late_retry_rest_day_week_and_bounds(self):
        self.at=datetime(2026,10,2,20,59,59,tzinfo=timezone.utc);one=self.dhikr(20)
        self.at+=timedelta(seconds=1);self.assertEqual(self.dhikr(100)['day'],'2026-10-03');self.assertTrue(self.s.today(self.mid)['assignment']['freeDay'])
        self.custom(dict(kind='surah',surahId=1,fromAyah=1,toAyah=7));self.assertEqual(self.s.today(self.mid)['evaluation']['dayCredit'],0)
        old=dict(mutationId=str(uuid4()),count=30,expectedRevision=1,day='2026-10-02',occurredAt='2026-10-02T20:59:59+00:00',timezone='UTC',utcOffsetMinutes=0)
        self.write('istighfar',old,self.s.istighfar_put);self.assertEqual(self.s.istighfar(self.mid,'2026-10-02')['count'],30)
        self.at+=timedelta(days=1);self.assertEqual(self.s.context()['weekStart'],'2026-10-04')
        for count in (-1,1000001,True,1.5):
            with self.assertRaises(DomainError):self.dhikr(count)
    def test_reactions_replace_remove_retries_and_hidden(self):
        self.dhikr(10);card=self.c.feed(self.mid,'daily','2026-10-01')['items'][0];target=card['id'];time=card['meaningfulAt']
        def react(body):return self.write('reaction',body,lambda m,b:self.c.reaction(m,'daily',target,b))
        heart=react(dict(reacted=True,expectedRevision=0));self.assertEqual(heart['reactions'],[{'emoji':'❤️','count':1}])
        clap=react(dict(emoji='👏',expectedRevision=1));self.assertEqual(clap['heartCount'],0);self.assertEqual(clap['viewerReaction'],'👏');self.assertEqual(clap['reactions'],[{'emoji':'👏','count':1}])
        with self.assertRaises(DomainError):react(dict(emoji='🔥',expectedRevision=1))
        body=dict(mutationId=str(uuid4()),emoji=None,expectedRevision=2);none=react(body);self.assertEqual(none,react(body));self.assertEqual(none['reactions'],[])
        self.assertEqual(self.c.feed(self.mid,'daily','2026-10-01')['items'][0]['meaningfulAt'],time)
        self.write('profile',dict(expectedRevision=1,communityVisible=False),self.s.profile_update)
        with self.assertRaises(DomainError):react(dict(emoji='👏',expectedRevision=3))
        self.assertEqual(len(self.c.own_weeks(self.mid)['items']),1)
    def test_construction_ship_has_stable_identity_and_dhikr_does_not_advance(self):
        one=self.s.ship_visual(self.mid);self.dhikr(100);two=self.s.ship_visual(self.mid)
        self.assertEqual(one['vesselId'],two['vesselId']);self.assertEqual(two['status'],'ready');self.assertEqual(two['state']['buildStep'],0);self.assertEqual(one['revision'],two['revision'])

    def test_custom_validation_ownership_and_pending_assignment(self):
        bad=dict(referenceVersion=REF.version,selection=dict(kind='juz',**{'from':1,'to':1}),ranges=[{'start':'2:1','end':'2:141'}],**self.occurrence())
        with self.assertRaises(DomainError):self.write('custom',bad,self.s.custom)
        self.assertFalse(self.s.state(self.mid)['acts'])
        body=dict(mutationId=str(uuid4()),expectedCommitmentId=self.s.commitment(self.mid)['effective']['id'],tier='BJ3',ruleVersion=self.s.current_rules(self.mid)['version'])
        self.s.mutate(self.mid,'change',body)
        out=self.custom(dict(kind='surah',surahId=114,fromAyah=1,toAyah=6));self.assertEqual(out['ranges'],[{'start':'114:1','end':'114:6'}])
        self.assertNotEqual(out['today']['evaluation']['status'],'completed')
        self.auth.register(dict(email='other@example.test',password='safe-test-password',displayName='other',tier='B',communityAcknowledged=True,countryCode='AU',istighfarGoal=100));other=self.store.db.execute('SELECT member_id FROM accounts WHERE email=?',('other@example.test',)).fetchone()[0]
        b=dict(mutationId=str(uuid4()),expectedRevision=1,reason='invalid owner')
        with self.assertRaises(DomainError):self.s.atomic(other,'custom',b,lambda:self.s.custom_correct(other,out['groupId'],b,True))
    def test_concurrent_devices_serialize_daily_absolute_counts(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        barrier=Barrier(2);path=self.store.path;at=self.at;mid=self.mid;occ=self.occurrence()
        def device(count):
            store=Store(path);s=ConnectedService(store,now=lambda:at,signing_key=b'x'*48)
            body=dict(mutationId=str(uuid4()),expectedRevision=0,count=count,day='2026-10-01',**occ)
            barrier.wait()
            try:return s.atomic(mid,'count',body,lambda:s.istighfar_put(mid,body))['count']
            except DomainError as e:return e.code
            finally:store.close()
        with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(device,[50,150]))
        self.assertEqual(results.count('REVISION_CONFLICT'),1);self.assertIn(self.s.istighfar(self.mid,'2026-10-01')['count'],(50,150));self.assertEqual(self.s.istighfar(self.mid,'2026-10-01')['revision'],1)
    def test_deleting_dhikr_actor_withdraws_and_removes_reactions(self):
        self.dhikr(100);card=self.c.feed(self.mid,'daily','2026-10-01')['items'][0]
        self.write('react',dict(expectedRevision=0,emoji='👏'),lambda m,b:self.c.reaction(m,'daily',card['id'],b))
        self.write('delete',dict(confirmation='DELETE'),self.s.request_deletion)
        self.assertFalse(self.store.db.execute('SELECT * FROM reactions WHERE member_id=?',(self.mid,)).fetchall())
        self.assertFalse(self.store.db.execute('SELECT * FROM community_cards WHERE member_id=? AND visible=1',(self.mid,)).fetchall())

    def test_startup_rebuilds_old_card_shape_before_advertising_new_contract(self):
        from unittest.mock import patch
        from safina.app_api import make_server
        self.custom(dict(kind='surah',surahId=36,fromAyah=1,toAyah=20))
        row=self.store.db.execute("SELECT id,payload FROM community_cards WHERE kind='daily'").fetchone();payload=json.loads(row['payload'])
        for name in ('facts','istighfar','istighfarComplete','completeWird'):payload.pop(name)
        self.store.db.execute('UPDATE community_cards SET payload=? WHERE id=?',(json.dumps(payload),row['id']))
        with patch('safina.app_api.ThreadingHTTPServer'):
            make_server(self.store.path,self.auth.config,clock=lambda:self.at)
        card=self.c.feed(self.mid,'daily','2026-10-01')['items'][0];self.assertIn('istighfar',card);self.assertIn('facts',card)
        self.assertEqual(self.store.db.execute("SELECT version FROM projection_versions WHERE name='community'").fetchone()[0],'0.5.0')
    def test_custom_evidence_saves_when_assignment_is_absent(self):
        from unittest.mock import patch
        with patch.object(self.s,'_segments',return_value=[]):
            out=self.custom(dict(kind='surah',surahId=36,fromAyah=1,toAyah=20))
            self.assertIsNone(out['today']);self.assertEqual(out['creditedIntersections'],[])
            self.assertIsNone(self.s.state(self.mid)['acts'][out['actId']]['assignmentId'])
            self.assertEqual(self.c.feed(self.mid,'daily','2026-10-01')['completeWirdMemberCount'],0)

    def test_original_day_before_assignment_keeps_custom_evidence_without_credit(self):
        old=self.at-timedelta(days=1)
        body=dict(referenceVersion=REF.version,selection=dict(kind='surah',surahId=36,fromAyah=1,toAyah=20),occurredAt=old.isoformat(),occurrenceDate=old.date().isoformat(),timezone='UTC',utcOffsetMinutes=0)
        result=self.write('custom',body,self.s.custom)
        self.assertIsNone(result['today']);self.assertEqual(result['creditedIntersections'],[])
        self.assertEqual(self.c.feed(self.mid,'daily','2026-09-30')['completeWirdMemberCount'],0)
        self.assertEqual(len(self.c.feed(self.mid,'daily','2026-09-30')['items']),1)

class OctoberMigrationTests(unittest.TestCase):
    def test_existing_hearts_migrate_exactly_once(self):
        import sqlite3
        from safina.domain import ROOT
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'old.db';db=sqlite3.connect(path)
            db.execute('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)')
            for file in sorted((ROOT/'migrations').glob('*.sql')):
                version=int(file.name.split('_')[0])
                if version>3:continue
                db.executescript(file.read_text());db.execute('INSERT INTO schema_migrations VALUES(?,?)',(version,'2026-09-30'));db.commit()
            db.execute("INSERT INTO members VALUES('member','hashed-token','Asia/Riyadh','2026-09-30T00:00:00Z')")
            db.execute("INSERT INTO accounts(member_id,provider,subject,email,status,profile,created_at) VALUES('member','sandbox','subject','old@example.test','active','{}','2026-09-30T00:00:00Z')")
            db.execute("INSERT INTO community_cards VALUES('target','member','daily','2026-09-30','{}',1,0,1,'2026-09-30T00:00:00Z')")
            db.execute("INSERT INTO reactions VALUES('member','target',1,4)");db.commit();db.close()
            for _ in range(2):
                store=Store(path);rows=store.db.execute('SELECT * FROM reactions').fetchall();self.assertEqual(len(rows),1);self.assertEqual(rows[0]['emoji'],'❤️');self.assertEqual(rows[0]['revision'],4);store.close()
