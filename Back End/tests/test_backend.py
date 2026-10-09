import copy
import json
import random
import sqlite3
import tempfile
import threading
import unittest
from datetime import date,datetime,timedelta,timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request,urlopen
from uuid import uuid4
from safina.domain import (REF,ROOT,RULE_VERSION,DomainError,assignment,civil,cycle_for,evaluate,instant,occurrence)
from safina.service import Service
from safina.store import Store
from safina.modules import Modules
from safina.api import make_server

B=[{'start':'2:1','end':'2:286'}]
FULL=[{'start':'1:1','end':'114:6'}]
def uid():return str(uuid4())

class BackendCase(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'db.sqlite3';self.store=Store(self.path)
        self.now=instant('2026-10-01T12:00:00+10:00');self.s=Service(self.store,now=lambda:self.now,signing_key=b'test-server-secret')
        self.token=self.s.provision('alice','B','Australia/Brisbane','2026-09-01')['token']
    def tearDown(self):self.store.close();self.tmp.cleanup()
    def member(self,tier,name='bob',start='2026-09-01',tz='Australia/Brisbane'):
        return self.s.provision(name,tier,tz,start)
    def report(self,day='2026-09-01',ranges=None,member='alice',source='manual_physical',**extra):
        a=self.s.today(member,day)['assignment']
        return {'mutationId':uid(),'logicalActId':uid(),'occurrenceDate':day,'occurredAt':day+'T09:00:00+10:00',
                'timezone':'Australia/Brisbane','utcOffsetMinutes':600,'ranges':ranges if ranges is not None else B,
                'source':source,'assignmentId':a['id'],'ruleVersion':RULE_VERSION,'referenceVersion':REF.version,**extra}
    def log(self,**kw):
        member=kw.get('member','alice');return self.s.mutate(member,'reading',self.report(**kw))
    def error(self,code,fn):
        with self.assertRaises(DomainError) as e:fn()
        self.assertEqual(e.exception.code,code);return e.exception
    def change(self,member,tier):
        return self.s.mutate(member,'change',{'mutationId':uid(),'tier':tier,'expectedCommitmentId':self.s._commitment_at(self.s.state(member),self.now)['id'],'ruleVersion':RULE_VERSION})
    def correct(self,act,ranges,retract=False):
        body={'mutationId':uid(),'expectedRevision':act['revision'],'reason':'member correction'}
        if not retract:body.update(ranges=ranges,ruleVersion=RULE_VERSION,referenceVersion=REF.version)
        return self.s.mutate(act['memberId'],'retract' if retract else 'correct',body,act['id'])
    def test_pinned_reference_and_edition(self):
        self.assertEqual((len(REF.data['verseCounts']),len(REF.all)),(114,6236))
        self.assertEqual(REF.ranges(REF.juz(1)),[{'start':'1:1','end':'2:141'}])
        self.assertEqual(REF.ranges(REF.juz(2)),[{'start':'2:142','end':'2:252'}])
        self.assertEqual(REF.ranges(REF.juz(16)),[{'start':'18:75','end':'20:135'}])
        self.assertEqual(set().union(*(REF.juz(i) for i in range(1,31))),REF.all)
        self.assertEqual(sum(len(REF.juz(i)) for i in range(1,31)),6236)
        p=REF.page('tanzil-medina-604','tanzil-pages-1.0',2)
        self.assertEqual(p['ranges'],[{'start':'2:1','end':'2:5'}])
        self.error('PAGE_MAP_NOT_AVAILABLE',lambda:REF.page('other-edition','1',2))
    def test_invalid_ranges(self):
        for ranges in [[{'start':'2:287','end':'3:1'}],[{'start':'2:4','end':'2:1'}],[{'start':'1:1','end':'2:1','words':4}]]:
            with self.assertRaises(DomainError):REF.coverage(ranges)
    def test_bj2_day_one_overlap_counts_once(self):
        self.member('BJ2');r=self.log(member='bob')
        self.assertEqual(r['evaluation']['dayCredit'],1);self.assertEqual(r['evaluation']['uniqueVerseCount'],286)
        k=self.s.khatmas('bob')['cycles'][0]
        self.assertEqual(k['completedJuz'],[2]);self.assertEqual(k['nextUnreadVerse'],'1:1')
        self.assertEqual(len(self.s.state('bob')['acts']),1)
    def test_partial_then_same_day_continuation(self):
        r=self.log(ranges=[{'start':'2:1','end':'2:141'}]);self.assertEqual(r['evaluation']['status'],'partial')
        self.assertIsNone(r['evaluation']['dayCredit']);self.assertEqual(r['evaluation']['openPolicies'][0]['code'],'RULE_NOT_APPROVED')
        r=self.log(ranges=[{'start':'2:142','end':'2:286'}]);self.assertEqual(r['evaluation']['dayCredit'],1)
    def test_repeats_and_duplicate_labels(self):
        a=self.log()['act']
        self.error('POSSIBLE_DUPLICATE',lambda:self.log())
        r=self.log(repeatOfActId=a['id']);self.assertEqual(r['evaluation']['uniqueVerseCount'],286)
        self.assertEqual(len(r['evaluation']['repeatedActs']),1);self.assertEqual(r['shipProgress']['approvedCredits'],1)
    def test_bi_requires_both(self):
        self.member('BI');self.assertIsNone(self.log(member='bob')['evaluation']['dayCredit'])
        r=self.log(member='bob',ranges=[{'start':'3:1','end':'3:200'}]);self.assertEqual(r['evaluation']['dayCredit'],1)
    def test_b_only_thirty_credits_ship_no_khatma_and_reverse(self):
        last=None
        for n in range(1,31):last=self.log(day=f'2026-09-{n:02d}')['act']
        ship=self.s.ship('alice');self.assertEqual(ship['approvedCredits'],30);self.assertEqual(ship['completedShipsWithinPeriods'],1)
        self.assertFalse(any(c['status']=='complete' for c in self.s.khatmas('alice')['cycles']))
        self.correct(last,[{'start':'2:1','end':'2:141'}]);ship=self.s.ship('alice')
        self.assertEqual(ship['approvedCredits'],29);self.assertEqual(ship['completedShipsWithinPeriods'],0)
        self.assertIn('2026-09-30',ship['unresolvedDayCredits'])
    def test_khatma_before_ship_and_correction_revokes(self):
        self.member('BJ5');r=self.log(member='bob',day='2026-09-06',ranges=FULL)
        self.assertEqual(r['shipProgress']['approvedCredits'],0)
        self.assertTrue(any(c['status']=='complete' for c in self.s.khatmas('bob')['cycles']))
        self.correct(r['act'],B)
        self.assertFalse(any(c['status']=='complete' for c in self.s.khatmas('bob')['cycles']))
        history=self.store.db.execute("SELECT count(*) FROM khatma_records WHERE member_id='bob'").fetchone()[0]
        self.assertGreater(history,1)
    def test_bj1_positions_february_free_reset(self):
        for day,j in [('2026-09-01',1),('2026-09-16',16)]:
            a=assignment(day,'BJ1','c','m','Australia/Brisbane');self.assertEqual(REF.coverage(a['components'][1]['ranges']),REF.juz(j))
        for day in ('2026-02-28','2028-02-29','2028-02-01'):
            a=assignment(day,'BJ1','c','m','Australia/Brisbane');self.assertEqual(a['openPolicies'][0]['code'],'SCHEDULE_NOT_PUBLISHED');self.assertEqual(a['ranges'],[])
        a=assignment('2026-08-31','BJ1','c','m','Australia/Brisbane');self.assertTrue(a['freeDay'])
        self.assertEqual(evaluate(a['date'],[a],[])['status'],'free_day')
        self.assertEqual(assignment('2026-09-01','BJ1','c','m','Australia/Brisbane')['cycle']['start'],'2026-09-01')
    def test_unapproved_grids_never_issue_guessed_prescriptions(self):
        for tier in ('BJ2','BJ3'):
            a=assignment('2026-09-02',tier,'c','m','UTC');self.assertEqual(a['status'],'awaiting_policy');self.assertEqual(a['ranges'],[])
        for tier in ('BJ4','BJ5'):
            a=assignment('2026-09-06',tier,'c','m','UTC');e=evaluate(a['date'],[a],[{'id':'a','revision':1,'ranges':FULL}])
            self.assertIsNone(e['dayCredit']);self.assertEqual(e['openPolicies'][0]['code'],'RULE_NOT_APPROVED')
    def test_bj5_six_day_coverage_and_sunday_reset(self):
        self.member('BJ5')
        for n in range(6):
            ranges=REF.ranges(set().union(*(REF.juz(j) for j in range(n*5+1,n*5+6))))
            self.log(member='bob',day=(date(2026,9,6)+timedelta(days=n)).isoformat(),ranges=ranges)
        cycles=self.s.khatmas('bob')['cycles'];k=next(c for c in cycles if c['start']=='2026-09-06')
        self.assertEqual(k['status'],'complete');self.assertEqual(k['completionDate'],'2026-09-11')
        sunday=self.s.today('bob','2026-09-13');self.assertEqual(sunday['nextUnreadVerse'],'1:1')
        self.assertEqual(sunday['khatmaCoverage']['coveredVerses'],0)
    def test_weekly_prior_incomplete_preserved(self):
        self.member('BJ5');self.log(member='bob',day='2026-09-12')
        self.assertEqual(self.s.today('bob','2026-09-13')['nextUnreadVerse'],'1:1')
        prior=next(c for c in self.s.khatmas('bob')['cycles'] if c['start']=='2026-09-06')
        self.assertEqual(prior['status'],'incomplete');self.assertEqual(prior['coveredVerses'],286)
    def test_bj4_needs_extra_two(self):
        self.member('BJ4')
        for n in range(7):self.log(member='bob',day=(date(2026,9,6)+timedelta(days=n)).isoformat(),ranges=REF.ranges(set().union(*(REF.juz(j) for j in range(n*4+1,n*4+5)))))
        k=next(c for c in self.s.khatmas('bob')['cycles'] if c['start']=='2026-09-06');self.assertEqual(k['status'],'incomplete')
        self.log(member='bob',day='2026-09-12',ranges=REF.ranges(REF.juz(29)|REF.juz(30)))
        self.assertEqual(next(c for c in self.s.khatmas('bob')['cycles'] if c['start']=='2026-09-06')['status'],'complete')
    def test_same_day_change_preserves_reading_and_history(self):
        self.member('BJ3');before=self.s.calendar('bob','2026-09-15','2026-09-15')
        self.log(member='bob',day='2026-09-16');self.now=instant('2026-09-16T14:00:00+10:00');self.change('bob','BJ1')
        t=self.s.today('bob','2026-09-16');self.assertEqual(t['assignment']['components'][1]['id'],'J16')
        self.assertEqual(t['evaluation']['uniqueVerseCount'],286);self.assertIsNone(t['evaluation']['dayCredit'])
        self.assertEqual([x['tier'] for x in t['evaluation']['historicalLevels']],['BJ3','BJ1'])
        self.assertEqual(before,self.s.calendar('bob','2026-09-15','2026-09-15'))
    def test_weekly_change_next_sunday_cross_cadence_gated(self):
        self.member('BJ5');self.now=instant('2026-09-23T14:00:00+10:00');c=self.change('bob','BJ4')['change']
        self.assertEqual(c['effectiveAt'],'2026-09-26T14:00:00+00:00')
        self.assertEqual(self.s.today('bob')['assignment']['tier'],'BJ5')
        self.now=instant('2026-09-27T01:00:00+10:00');self.assertEqual(self.s.today('bob')['assignment']['tier'],'BJ4')
        self.error('RULE_NOT_APPROVED',lambda:self.change('alice','BJ5'))
    def test_offline_old_segment_preserved_and_stale_after_switch_rejected(self):
        body=self.report(day='2026-09-16');self.now=instant('2026-09-16T14:00:00+10:00');self.change('alice','BI')
        self.assertEqual(self.s.mutate('alice','reading',body)['act']['assignmentId'],body['assignmentId'])
        stale={**body,'logicalActId':uid(),'mutationId':uid(),'occurredAt':'2026-09-16T15:00:00+10:00'};self.now=instant('2026-09-16T16:00:00+10:00')
        self.error('STALE_ASSIGNMENT',lambda:self.s.mutate('alice','reading',stale))
    def test_idempotency_and_revision_conflict(self):
        body=self.report();one=self.s.mutate('alice','reading',body)
        self.assertEqual(one,self.s.mutate('alice','reading',body))
        self.error('IDEMPOTENCY_CONFLICT',lambda:self.s.mutate('alice','reading',{**body,'ranges':FULL}))
        self.correct(one['act'],[{'start':'2:1','end':'2:5'}])
        self.assertEqual(one,self.s.mutate('alice','reading',body)) # original receipt is stable, not live state
        self.error('REVISION_CONFLICT',lambda:self.correct(one['act'],B))
    def test_logical_act_id_dedupes_across_source_retries(self):
        b=self.report();self.s.mutate('alice','reading',b)
        self.error('ACT_ALREADY_EXISTS',lambda:self.s.mutate('alice','reading',{**b,'mutationId':uid(),'source':'manual'}))
    def test_stale_versions(self):
        b=self.report();b['ruleVersion']='old'
        self.error('INCOMPATIBLE_SNAPSHOT',lambda:self.s.mutate('alice','reading',b));self.assertFalse(self.s.state('alice')['acts'])
    def trace_body(self,observations):
        return {'mutationId':uid(),'expectedRevision':0,'occurrenceDate':'2026-09-01','occurredAt':'2026-09-01T09:00:00+10:00','timezone':'Australia/Brisbane','utcOffsetMinutes':600,'observations':observations,'referenceVersion':REF.version}
    def test_reader_observation_zero_then_override_and_correction(self):
        tid=uid();self.s.mutate('alice','trace',self.trace_body([{'kind':'exposed','ranges':B}]),tid)
        self.assertEqual(self.s.ship('alice')['approvedCredits'],0);self.assertEqual(self.s.khatmas('alice')['cycles'][0]['coveredVerses'],0)
        r=self.log(source='reader_confirmed',traceId=tid,ranges=[{'start':'2:1','end':'2:141'}]);self.assertEqual(r['evaluation']['status'],'partial')
        self.assertEqual(self.s.trace('alice',tid)['trace']['suggestedRanges'],B)
        r=self.correct(r['act'],B);self.assertEqual(r['evaluation']['dayCredit'],1)
        self.error('TRACE_ALREADY_CONFIRMED',lambda:self.log(source='reader_confirmed',traceId=tid,ranges=[{'start':'2:142','end':'2:286'}]))
    def test_opening_audio_do_not_suggest_or_credit_and_discard(self):
        tid=uid();r=self.s.mutate('alice','trace',self.trace_body([{'kind':'page_opened','ranges':B},{'kind':'audio_played','ranges':FULL}]),tid)
        self.assertEqual(r['trace']['suggestedRanges'],[])
        self.s.mutate('alice','discard_trace',{'mutationId':uid(),'expectedRevision':1},tid)
        self.error('TRACE_NOT_FOUND',lambda:self.log(source='reader_confirmed',traceId=tid))
    def test_trace_after_log_does_not_break_materialized_immutable_evaluation(self):
        self.log();self.s.mutate('alice','trace',self.trace_body([{'kind':'exposed','ranges':B}]),uid())
        self.assertEqual(self.s.ship('alice')['approvedCredits'],1)
    def test_undo_replay_determinism(self):
        r=self.log();self.correct(r['act'],B,True)
        self.assertEqual(self.s.ship('alice')['approvedCredits'],0)
        self.assertEqual(self.s.replay('alice'),self.s.replay('alice'))
        self.store.close();self.store=Store(self.path);self.s=Service(self.store,now=lambda:self.now)
        self.assertEqual(self.s.ship('alice')['approvedCredits'],0)
    def test_signed_snapshot_tamper_and_ownership(self):
        env=self.s.offline_snapshot('alice','2026-09-01');self.assertTrue(self.s.verify_snapshot('alice',env)['valid'])
        self.error('FORBIDDEN',lambda:self.s.verify_snapshot('bob',env))
        env['payload']['assignment']['tier']='BJ5';self.error('INVALID_SIGNATURE',lambda:self.s.verify_snapshot('alice',env))
    def test_local_midnight_and_dst_offsets(self):
        for occurred,date_,offset in [('2026-10-03T14:00:00Z','2026-10-04',600),('2026-10-03T16:00:00Z','2026-10-04',660),('2026-04-04T15:59:00Z','2026-04-05',660),('2026-04-04T16:00:00Z','2026-04-05',600)]:
            occurrence({'occurredAt':occurred,'occurrenceDate':date_,'timezone':'Australia/Sydney','utcOffsetMinutes':offset},instant('2026-12-01T00:00:00Z'))
        self.error('OCCURRENCE_MISMATCH',lambda:occurrence({'occurredAt':'2026-10-04T03:00:00+10:00','occurrenceDate':'2026-10-04','timezone':'Australia/Sydney','utcOffsetMinutes':600},instant('2026-12-01T00:00:00Z')))
        self.assertEqual(cycle_for('2026-10-04','BJ5')['start'],'2026-10-04')
    def test_travel_preserves_zone_but_credit_gated(self):
        b=self.report(day='2026-09-16');b.update(occurredAt='2026-09-16T09:00:00+01:00',timezone='Europe/London',utcOffsetMinutes=60)
        r=self.s.mutate('alice','reading',b);self.assertEqual(r['act']['timezone'],'Europe/London');self.assertIsNone(r['evaluation']['dayCredit'])
        self.assertEqual(r['evaluation']['openPolicies'][0]['policy'],'pause_travel')
    def test_dhikr_revision_separate_from_credit(self):
        gid=uid();self.s.mutate('alice','dhikr_goal',{'mutationId':uid(),'id':gid,'expectedRevision':0,'label':'personal practice','target':100})
        cid=uid();b={'mutationId':uid(),'id':cid,'expectedRevision':0,'goalId':gid,'date':'2026-09-01','count':50}
        self.s.mutate('alice','dhikr_count',b);self.s.mutate('alice','dhikr_count',{**b,'mutationId':uid(),'expectedRevision':1,'count':20})
        self.assertEqual(self.s.state('alice')['dhikrCounts'][cid]['count'],20);self.assertEqual(self.s.ship('alice')['approvedCredits'],0)
    def test_module_drafts_are_not_publication(self):
        m=Modules(self.store);r=m.save_draft('ClassroomCourse','course1',{'title':'Unapproved draft','weeks':10,'entitlementKey':None})
        self.assertEqual(r['status'],'draft');self.error('RULE_NOT_APPROVED',lambda:m.grade());self.error('RULE_NOT_APPROVED',lambda:m.publish())
        self.error('RULE_NOT_APPROVED',lambda:m.search());self.assertIsNone(m.entitlements()['price'])
    def test_private_ownership_and_no_automatic_publication(self):
        self.member('B');act=self.log()['act'];self.error('NOT_FOUND',lambda:self.s.mutate('bob','correct',{'mutationId':uid(),'expectedRevision':1,'ranges':B,'reason':'edit','ruleVersion':RULE_VERSION,'referenceVersion':REF.version},act['id']))
        self.assertEqual(self.s.ship('bob')['approvedCredits'],0);self.assertEqual(self.store.db.execute('SELECT count(*) FROM group_publications').fetchone()[0],0)
    def test_event_and_rule_immutability(self):
        self.log()
        for sql in ("UPDATE events SET kind='fake'","DELETE FROM events","UPDATE records SET payload='{}'"):
            with self.assertRaises(sqlite3.IntegrityError):self.store.db.execute(sql)
    def test_free_day_logs_do_not_claim_unapproved_catchup_khatma(self):
        self.member('BJ1',start='2026-08-01');r=self.log(member='bob',day='2026-08-31',ranges=FULL)
        self.assertEqual(r['evaluation']['status'],'free_day');self.assertEqual(r['evaluation']['dayCredit'],0)
        k=self.s.khatmas('bob')['cycles'][0];self.assertEqual(k['coveredVerses'],0);self.assertTrue(k['excludedFreeDayActs'])
    def test_supplemental_and_no_entry(self):
        self.assertEqual(self.s.day('alice','2026-09-01')['dayCredit'],0)
        r=self.log(ranges=[{'start':'114:1','end':'114:6'}]);self.assertEqual(r['evaluation']['status'],'supplemental_only');self.assertEqual(r['evaluation']['dayCredit'],0)
    def test_partial_properties_randomized(self):
        rng=random.Random(20260928);a=assignment('2026-09-01','B','c','m','UTC')
        for _ in range(150):
            acts=[]
            for i in range(rng.randint(0,8)):
                x,y=sorted([rng.randrange(6236),rng.randrange(6236)])
                acts.append({'id':str(i),'revision':1,'ranges':REF.ranges(range(x,y+1))})
            e=evaluate(a['date'],[a],acts)
            self.assertIn(e['dayCredit'],(None,0,1))
            self.assertEqual(evaluate(a['date'],[a],acts)['uniqueCoverage'],evaluate(a['date'],[a],acts+acts)['uniqueCoverage'])
            self.assertEqual(e['dayCredit'],evaluate(a['date'],[a],acts+acts)['dayCredit'])
    def test_calendar_properties_all_dates_and_tiers(self):
        for n in range(730):
            d=(date(2027,1,1)+timedelta(days=n)).isoformat()
            for tier in ('BJ4','BJ5'):
                c=cycle_for(d,tier);self.assertEqual(civil(c['start']).weekday(),6);self.assertTrue(c['start']<=d<=c['end'])
            a=assignment(d,'BJ1','c','m','UTC')
            if civil(d).month==2:self.assertNotEqual(a['status'],'published')
    def test_http_auth_privacy_mutation_and_error_envelopes(self):
        server=make_server(self.path,port=0,signing_key=b'test',clock=lambda:self.now)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();base=f'http://127.0.0.1:{server.server_port}'
        def req(path,token=None,body=None,method='GET'):
            headers={'Content-Type':'application/json'}
            if token:headers['Authorization']='Bearer '+token
            r=Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
            try:
                with urlopen(r,timeout=5) as x:return x.status,json.load(x)
            except HTTPError as e:return e.code,json.load(e)
        try:
            self.assertEqual(req('/health')[0],200);self.assertEqual(req('/calendar?start=2026-09-01&end=2026-09-02')[0],401)
            self.assertEqual(req('/today?date=2026-09-01',self.token)[0],200)
            status,r=req('/reading-acts',self.token,self.report(),method='POST');self.assertEqual(status,200);self.assertEqual(r['evaluation']['dayCredit'],1)
            token=self.member('B')['token'];self.assertEqual(req('/reading-acts/'+r['act']['id'],token)[0],404)
            self.assertEqual(req('/groups/publications',self.token,{},method='POST')[1]['error']['code'],'RULE_NOT_APPROVED')
            self.assertEqual(req('/reading-acts',self.token,{'mutationId':uid(),'memberId':'bob'},method='POST')[0],422)
        finally:server.shutdown();server.server_close();thread.join()


    def test_direct_row_is_explicit_member_report(self):
        r=self.log(source='component_self_report',componentId='B')
        self.assertEqual(r['evaluation']['dayCredit'],1)
        self.error('COMPONENT_MISMATCH',lambda:self.log(day='2026-09-02',source='component_self_report',componentId='B',ranges=[{'start':'2:1','end':'2:5'}]))
        self.error('INVALID_SOURCE',lambda:self.log(day='2026-09-02',source='reader_suggestion'))
    def test_bj5_saturday_is_free_with_factual_catchup(self):
        self.member('BJ5')
        t=self.s.today('bob','2026-09-12');self.assertEqual(t['evaluation']['status'],'free_day')
        self.assertEqual(t['evaluation']['dayCredit'],0)
        r=self.log(member='bob',day='2026-09-12',ranges=FULL)
        self.assertEqual(r['evaluation']['dayCredit'],0)
        self.assertTrue(any(c['status']=='complete' for c in self.s.khatmas('bob')['cycles']))
    def test_ship_carry_not_silently_assumed(self):
        self.member('B',start='2026-08-01')
        for day in ('2026-08-01','2026-09-01'):self.log(member='bob',day=day)
        ship=self.s.ship('bob');self.assertEqual(ship['approvedCredits'],2)
        self.assertIsNone(ship['currentShip']);self.assertIsNone(ship['lifetimeShipCount'])
        self.assertEqual([p['approvedCredits'] for p in ship['periods']],[1,1])
    def test_future_empty_invalid_zone_and_member_spoof_rejected(self):
        self.error('EMPTY_READING',lambda:self.log(ranges=[]))
        body=self.report();body['occurredAt']='2026-12-01T09:00:00+10:00';body['occurrenceDate']='2026-12-01'
        self.error('FUTURE_READING',lambda:self.s.mutate('alice','reading',body))
        body=self.report();body['timezone']='Not/A_Zone'
        self.error('INVALID_TIMEZONE',lambda:self.s.mutate('alice','reading',body))
        body=self.report();body['memberId']='bob'
        self.error('INVALID_FIELDS',lambda:self.s.mutate('alice','reading',body))

if __name__=='__main__':unittest.main()
