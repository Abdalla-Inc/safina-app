import json,tempfile,unittest
from pathlib import Path
from datetime import datetime,timezone,timedelta
from uuid import uuid4
from safina.store import Store
from safina.connected import ConnectedService
from safina.identity import Identity,Config
from safina.app_api import dispatch
from safina.domain import REF,DomainError
from safina.custom_plans import assigned,normalize,RULE
from safina.community import Community

class LaunchTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=Store(Path(self.tmp.name)/'db');self.at=datetime(2026,10,1,8,tzinfo=timezone.utc)
        self.s=ConnectedService(self.store,now=lambda:self.at,signing_key=b'x'*48);self.config=Config(b'x'*48,super_admin_email='owner@example.test');self.auth=Identity(self.s,self.config)
    def tearDown(self):self.store.close();self.tmp.cleanup()
    def register(self,address='owner@example.test',period='weekly',surah=36,end=83,target=None):
        plan=dict(period=period,selections=[dict(surahId=surah,fromAyah=1,toAyah=end)])
        if target:plan['verseTarget']=target
        self.auth.register(dict(email=address,password='safe-test-password',displayName='Test',tier='CUSTOM',customWird=plan,communityAcknowledged=True,countryCode='AU',istighfarGoal=100))
        return self.store.db.execute('SELECT member_id FROM accounts WHERE email=?',(address,)).fetchone()[0]
    def write(self,mid,route,body,method='PUT'):
        return dispatch(self.s,self.config,mid,method,route,{},dict(mutationId=str(uuid4()),**body))
    def test_owner_only_after_verification_and_preview_is_not_evidence(self):
        mid=self.register();self.assertFalse(self.s.me(mid)['permissions']['shipPreview'])
        with self.assertRaises(DomainError):self.auth.login(dict(email='owner@example.test',password='safe-test-password'))
        self.store.db.execute('UPDATE sandbox_identities SET verified=1');self.auth.login(dict(email='owner@example.test',password='safe-test-password'))
        self.assertTrue(self.s.me(mid)['permissions']['superAdmin']);before=self.store.events(mid)
        out=self.write(mid,'/admin/ship-preview',dict(expectedRevision=0,buildStep=30,health=0,celebration=True));self.assertTrue(out['enabled'])
        self.assertEqual(before,self.store.events(mid));self.assertEqual(self.s.ship(mid)['approvedCredits'],0)
        with self.assertRaises(DomainError):self.write(mid,'/admin/ship-preview',dict(expectedRevision=0,buildStep=1,health=100,celebration=False))
        self.assertFalse(self.write(mid,'/admin/ship-preview',dict(expectedRevision=1),'DELETE')['enabled'])
        self.store.db.execute("UPDATE accounts SET role='member'")
        with self.assertRaises(DomainError):dispatch(self.s,self.config,mid,'GET','/admin/ship-preview',{},{} )
    def test_weekly_midperiod_portions_and_rest(self):
        mid=self.register();c=self.s.commitment(mid)['effective']
        thu=assigned(mid,'2026-10-01',c);fri=assigned(mid,'2026-10-02',c);sat=assigned(mid,'2026-10-03',c)
        self.assertEqual([len(REF.coverage(a['ranges'])) for a in (thu,fri,sat)],[42,41,0])
        self.assertFalse(REF.coverage(thu['ranges']) & REF.coverage(fri['ranges']));self.assertTrue(sat['freeDay'])
        self.assertEqual(self.s.today(mid)['customWird']['dailyTargetVerseCount'],42)
        nextweek=[assigned(mid,f'2026-10-{i:02}',c) for i in range(4,11)]
        self.assertEqual(sum(len(REF.coverage(a['ranges'])) for a in nextweek),83)
    def test_monthly_leap_and_small_target_are_exact(self):
        mid=self.register(period='monthly',target=7);c=self.s.commitment(mid)['effective']
        c={**c,'effectiveAt':'2028-02-01T00:00:00+03:00'}
        portions=[assigned(mid,f'2028-02-{i:02}',c) for i in range(1,30)]
        self.assertEqual(sum(len(REF.coverage(a['ranges'])) for a in portions),7)
        self.assertEqual(sum(not a['freeDay'] for a in portions),7)
        other=self.register('other@example.test',period='monthly',surah=1,end=7)
        self.s.today(mid);self.s.today(other) # per-member custom monthly schedules never collide
    def test_completion_replay_and_custom_overlap_counts_only_today(self):
        mid=self.register();today=self.s.today(mid)
        body=dict(assignmentId=today['assignment']['id'],expectedInputHash=today['evaluation']['inputHash'],completed=True,occurredAt=self.at.isoformat(),occurrenceDate='2026-10-01',timezone='UTC',utcOffsetMinutes=0)
        out=self.write(mid,'/today/components/CUSTOM',body)['today']
        self.assertEqual(out['evaluation']['dayCredit'],1);self.assertEqual(out['customWird']['coveredVerseCount'],42)
        self.assertEqual(Community(self.s).feed(mid,'daily','2026-10-01')['completeWirdMemberCount'],1)
        self.write(mid,'/today/components/CUSTOM',dict(assignmentId=out['assignment']['id'],expectedInputHash=out['evaluation']['inputHash'],completed=False))
        self.assertEqual(self.s.today(mid)['customWird']['coveredVerseCount'],0)
    def test_change_next_day_idempotency_and_original_snapshot(self):
        mid=self.register();old=self.s.today(mid);c=self.s.commitment(mid)['effective']
        body=dict(mutationId=str(uuid4()),expectedCommitmentId=c['id'],customWird=dict(period='daily',selections=[dict(surahId=1,fromAyah=1,toAyah=7)]))
        a=dispatch(self.s,self.config,mid,'PUT','/me/custom-wird',{},body)
        self.assertEqual(a,dispatch(self.s,self.config,mid,'PUT','/me/custom-wird',{},body))
        self.assertEqual(self.s.today(mid)['assignment'],old['assignment'])
        self.at+=timedelta(days=1);self.assertEqual(self.s.today(mid)['customWird']['dailyTargetVerseCount'],7)
    def test_reject_invalid_custom_and_client_role(self):
        for plan in (dict(period='weekly',selections=[]),dict(period='monthly',selections=[dict(surahId=1,fromAyah=7,toAyah=1)]),dict(period='weekly',selections=[dict(surahId=1,fromAyah=1,toAyah=7)],verseTarget=8)):
            with self.assertRaises(DomainError):normalize(plan)
        mid=self.register('member@example.test')
        with self.assertRaises(DomainError):self.write(mid,'/admin/ship-preview',dict(expectedRevision=0,buildStep=30,health=100,celebration=True))
        with self.assertRaises(DomainError):self.write(mid,'/me',dict(expectedRevision=1,role='founder'),'PATCH')

    def test_ship_progress_replay_and_completed_construction_gate(self):
        mid=self.register(period='daily',surah=1,end=1);vessel=self.s.ship_visual(mid);self.assertEqual(vessel['state']['buildStep'],0)
        for i in range(36):
            self.at=datetime(2026,10,1,8,tzinfo=timezone.utc)+timedelta(days=i)
            today=self.s.today(mid)
            if today['assignment']['freeDay']:continue
            self.write(mid,'/today/components/CUSTOM',dict(assignmentId=today['assignment']['id'],expectedInputHash=today['evaluation']['inputHash'],completed=True,occurredAt=self.at.isoformat(),occurrenceDate=self.at.date().isoformat(),timezone='UTC',utcOffsetMinutes=0))
        full=self.s.ship_visual(mid);self.assertEqual(full['earnedBuildStep'],30);self.assertIsNone(full['state']);self.assertEqual(full['status'],'awaiting_policy')
        self.assertEqual(full['vesselId'],vessel['vesselId']);self.assertGreater(full['revision'],vessel['revision'])
        acts=list(self.s.state(mid)['acts'].values())
        for act in acts[:2]:
            self.s.mutate(mid,'retract',dict(mutationId=str(uuid4()),expectedRevision=1,reason='Correct mistaken sample'),act['id'])
        corrected=self.s.ship_visual(mid);self.assertEqual(corrected['status'],'ready');self.assertEqual(corrected['state']['buildStep'],29)
        self.assertGreater(corrected['revision'],full['revision']);self.assertEqual(corrected['vesselId'],full['vesselId'])
