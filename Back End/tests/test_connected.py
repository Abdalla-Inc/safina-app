import json,tempfile,unittest
from datetime import datetime,timedelta,timezone
from pathlib import Path
from uuid import uuid4
from safina.store import Store
from safina.connected import ConnectedService
from safina.identity import Config,Identity,hashed
from safina.community import Community
from safina.domain import DomainError,REF
from safina.policy_v2 import RULE,assigned,week,mecca_day
from safina.learning import Learning

class ConnectedTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=Store(Path(self.tmp.name)/'app.db');self.at=datetime(2026,9,30,12,tzinfo=timezone.utc)
        self.s=ConnectedService(self.store,now=lambda:self.at,signing_key=b'x'*48);self.config=Config(b'x'*48);self.auth=Identity(self.s,self.config)
        self.mid,self.session,self.token=self.account('one@safina.test')
    def tearDown(self):self.store.close();self.tmp.cleanup()
    def account(self,email,tier='B'):
        self.auth.register({'email':email,'password':'testing-password-123','displayName':'قارئ','tier':tier,'communityAcknowledged':True,'countryCode':'SD','istighfarGoal':100})
        row=self.store.db.execute('SELECT payload FROM sandbox_mailbox WHERE email=? ORDER BY id DESC',(email,)).fetchone()
        session,token=self.auth.verify({'email':email,'code':json.loads(row[0])['code']})
        return session['memberId'],session,token
    def occurrence(self):return {'occurredAt':self.at.isoformat(),'occurrenceDate':self.at.date().isoformat(),'timezone':'UTC','utcOffsetMinutes':0}
    def toggle(self,completed=True,mid=None):
        mid=mid or self.mid;t=self.s.today(mid);id=t['assignment']['components'][0]['id']
        b={'mutationId':str(uuid4()),'assignmentId':t['assignment']['id'],'expectedInputHash':t['evaluation']['inputHash'],'completed':completed,**self.occurrence()}
        return self.s.atomic(mid,'component:'+id,b,lambda:self.s.component(mid,id,b))
    def partial(self,ranges,mid=None):
        mid=mid or self.mid;t=self.s.today(mid);b={'mutationId':str(uuid4()),'assignmentId':t['assignment']['id'],'expectedInputHash':t['evaluation']['inputHash'],'ranges':ranges,**self.occurrence()}
        return self.s.atomic(mid,'partial',b,lambda:self.s.partial(mid,b))
    def test_verified_sessions_csrf_refresh_and_revoke(self):
        self.assertEqual(self.auth.session(self.token)['member_id'],self.mid)
        with self.assertRaises(DomainError):self.auth.session(self.token,'wrong',True)
        session,token=self.auth.refresh(self.token,self.session['csrfToken'])
        with self.assertRaises(DomainError):self.auth.session(self.token)
        self.auth.logout(token,session['csrfToken'])
        with self.assertRaises(DomainError):self.auth.session(token)
    def test_new_rule_mecca_and_saturday_all_tiers(self):
        from safina.domain import TIERS
        for tier in TIERS:
            a=assigned('2026-10-03',tier,'c','m');self.assertTrue(a['freeDay']);self.assertEqual(a['components'],[])
        self.assertEqual(mecca_day(datetime(2026,9,30,21,tzinfo=timezone.utc)),'2026-10-01')
        self.assertEqual(week('2026-10-03')['weekStart'],'2026-09-27')
        self.assertEqual(self.s.today(self.mid)['assignment']['ruleVersion'],RULE)
    def test_partial_weekly_no_daily_then_complete_and_undo(self):
        self.partial([{'start':'2:1','end':'2:5'}]);c=Community(self.s)
        self.assertEqual(c.feed(self.mid,'daily','2026-09-30')['items'],[])
        weekly=c.feed(self.mid,'weekly','2026-09-27');self.assertEqual(weekly['participantCount'],1)
        self.toggle();daily=c.feed(self.mid,'daily','2026-09-30');self.assertEqual(daily['completeWirdMemberCount'],1)
        self.assertEqual(len(daily['items']),1)
        self.toggle(False);self.assertEqual(c.feed(self.mid,'daily','2026-09-30')['items'],[])
        self.assertEqual(self.s.today(self.mid)['evaluation']['uniqueCoverage'],[{'start':'2:1','end':'2:5'}])
    def test_idempotency_conflict_and_account_isolation(self):
        t=self.s.today(self.mid);id=t['assignment']['components'][0]['id'];b={'mutationId':str(uuid4()),'assignmentId':t['assignment']['id'],'expectedInputHash':t['evaluation']['inputHash'],'completed':True,**self.occurrence()}
        a=self.s.atomic(self.mid,'toggle',b,lambda:self.s.component(self.mid,id,b));again=self.s.atomic(self.mid,'toggle',b,lambda:None);self.assertEqual(a,again)
        with self.assertRaises(DomainError):self.s.atomic(self.mid,'toggle',{**b,'completed':False},lambda:None)
        other,_,_=self.account('two@safina.test')
        with self.assertRaises(DomainError):self.s.atomic(other,'toggle',b,lambda:self.s.component(other,id,b))
        self.assertFalse(self.s.state(other)['acts'])
    def test_reactions_and_visibility_revocation(self):
        other,_,_=self.account('two@safina.test');self.toggle();c=Community(self.s);card=c.feed(other,'daily','2026-09-30')['items'][0]
        b={'mutationId':str(uuid4()),'reacted':True,'expectedRevision':0};r=self.s.atomic(other,'heart',b,lambda:c.reaction(other,'daily',card['id'],b));self.assertEqual(r['heartCount'],1)
        self.assertEqual(c.feed(other,'weekly','2026-09-27')['items'][0]['heartCount'],0)
        b={'mutationId':str(uuid4()),'expectedRevision':1,'communityVisible':False};self.s.atomic(self.mid,'profile',b,lambda:self.s.profile_update(self.mid,b))
        self.assertEqual(c.feed(other,'daily','2026-09-30')['items'],[])
        self.assertEqual(len(c.own_weeks(self.mid)['items']),1)
    def test_reader_saves_no_reading_and_conflict(self):
        b={'mutationId':str(uuid4()),'expectedRevision':0,'edition':'hafs-madani-604','mapVersion':'tanzil-pages-1.0','page':604,'bookmarks':[1,604]}
        result=self.s.atomic(self.mid,'reader',b,lambda:self.s.reader_put(self.mid,b));self.assertEqual(result['page'],604);self.assertFalse(self.s.state(self.mid)['acts'])
        with self.assertRaises(DomainError):self.s.reader_put(self.mid,b)
    def test_pagination_snapshot_excludes_new_arrival(self):
        self.toggle();two,_,_=self.account('two@safina.test');self.toggle(mid=two);c=Community(self.s)
        page=c.feed(self.mid,'daily','2026-09-30',limit=1)
        three,_,_=self.account('three@safina.test');self.toggle(mid=three)
        second=c.feed(self.mid,'daily','2026-09-30',page['nextCursor'],1)
        self.assertNotEqual(page['items'][0]['id'],second['items'][0]['id']);self.assertEqual(second['completeWirdMemberCount'],2);self.assertIsNone(second['nextCursor'])
        self.toggle(False,mid=two)
        with self.assertRaises(DomainError):c.feed(self.mid,'daily','2026-09-30',page['nextCursor'],1)
    def test_deletion_withdraws_and_revokes(self):
        self.toggle();b={'mutationId':str(uuid4()),'confirmation':'DELETE'}
        result=self.s.atomic(self.mid,'delete',b,lambda:self.s.request_deletion(self.mid,b));self.assertEqual(result['physicalErasure'],'pending_retention_review')
        with self.assertRaises(DomainError):self.auth.session(self.token)
        self.assertFalse(self.store.db.execute('SELECT id FROM community_cards WHERE visible=1').fetchall())
    def course(self):
        lesson=lambda n:{'id':'l'+str(n),'title':'درس اختبار','required':True,'thumbnail':None,'durationSeconds':0,'video':None,'resources':[],'completionPolicy':'member_confirmation','completionPolicyApproved':True}
        return {'id':'test','version':1,'title':'اختبار مسار التعلّم — ليس دورة منشورة','format':'weekly','thumbnail':None,'free':True,'sandbox':True,'published':True,'rightsReviewed':True,'editorialReviewed':True,
                'modules':[{'id':'m'+str(n),'title':'أسبوع اختبار','lessons':[lesson(n)],'questions':[{'id':'q','prompt':'إجابة اختبار','required':True}]} for n in (1,2)]}
    def test_learning_prerequisites_and_private_answers(self):
        l=Learning(self.s,self.config);l.publish_course(self.course())
        with self.assertRaises(DomainError):l.lesson_detail(self.mid,'test','l2')
        b={'mutationId':str(uuid4()),'expectedRevision':0,'courseVersion':1,'positionSeconds':0,'completed':True}
        self.s.atomic(self.mid,'progress',b,lambda:l.write_lesson(self.mid,'test','l1','progress',b))
        with self.assertRaises(DomainError):l.lesson_detail(self.mid,'test','l2')
        b={'mutationId':str(uuid4()),'expectedRevision':0,'courseVersion':1,'answers':{'q':'إجابة'}}
        self.s.atomic(self.mid,'answers',b,lambda:l.answers(self.mid,'test','m1',b,True));self.assertEqual(l.lesson_detail(self.mid,'test','l2')['id'],'l2')
        other,_,_=self.account('two@safina.test');self.assertEqual(l.record(other,'test','answers','m1'),{'revision':0})
        self.assertFalse(self.s.state(self.mid)['acts'])
    def test_founder_preview_does_not_fabricate_progress(self):
        l=Learning(self.s,self.config);l.publish_course(self.course());self.store.db.execute("UPDATE accounts SET role='founder' WHERE member_id=?",(self.mid,))
        self.assertEqual(l.lesson_detail(self.mid,'test','l2')['progress'],{'revision':0});self.assertFalse(l.detail(self.mid,'test')['complete'])

if __name__=='__main__':unittest.main()

class ExtendedConnectedTests(ConnectedTests):
    # Explicitly remove inherited cases from this test class below; use shared setup/helpers.
    def test_original_day_survives_timezone_and_delayed_sync(self):
        self.at=datetime(2026,9,30,21,10,tzinfo=timezone.utc)
        t=self.s.today(self.mid);self.assertEqual(t['assignmentDay'],'2026-10-01')
        b={'mutationId':str(uuid4()),'assignmentId':t['assignment']['id'],'expectedInputHash':t['evaluation']['inputHash'],'ranges':[{'start':'2:1','end':'2:4'}],**self.occurrence()}
        self.at+=timedelta(days=2)
        self.s.atomic(self.mid,'offline',b,lambda:self.s.partial(self.mid,b))
        act=list(self.s.state(self.mid)['acts'].values())[0]
        self.assertEqual(act['occurrenceDate'],'2026-09-30');self.assertEqual(act['assignmentDay'],'2026-10-01')
        self.assertEqual(Community(self.s).own_days(self.mid,'2026-09-27')['days'][0]['day'],'2026-10-01')
    def test_undo_combined_act_preserves_other_component(self):
        mid,_,_=self.account('combined@safina.test','BI');self.partial([{'start':'2:1','end':'3:200'}],mid=mid)
        self.toggle(False,mid=mid)
        self.assertEqual(self.s.today(mid)['evaluation']['uniqueCoverage'],[{'start':'3:1','end':'3:200'}])
        card=Community(self.s).feed(mid,'daily','2026-09-30')['items'][0]
        self.assertEqual([c['id'] for c in card['completedComponents']],['I']);self.assertFalse(card['assignedWirdComplete'])
    def test_saturday_voluntary_no_credit(self):
        self.at=datetime(2026,10,3,12,tzinfo=timezone.utc)
        self.partial([{'start':'2:1','end':'2:10'}])
        self.assertEqual(self.s.today(self.mid)['evaluation']['dayCredit'],0)
        self.assertEqual(Community(self.s).feed(self.mid,'weekly','2026-09-27')['participantCount'],1)
        self.assertEqual(Community(self.s).feed(self.mid,'daily','2026-10-03')['items'],[])
    def test_recovery_one_use_and_session_revocation(self):
        self.auth.recover({'email':'one@safina.test'})
        code=json.loads(self.store.db.execute("SELECT payload FROM sandbox_mailbox WHERE kind='recovery' ORDER BY id DESC").fetchone()[0])['code']
        body={'email':'one@safina.test','code':code,'password':'new-password-123'};self.auth.reset_password(body)
        with self.assertRaises(DomainError):self.auth.session(self.token)
        with self.assertRaises(DomainError):self.auth.reset_password(body)
        self.assertEqual(self.auth.login({'email':'one@safina.test','password':'new-password-123'})[0]['memberId'],self.mid)
    def test_avatar_validation_removal_and_privacy(self):
        import io,base64
        from PIL import Image
        raw=io.BytesIO();Image.new('RGB',(400,300),'red').save(raw,format='PNG')
        b={'mutationId':str(uuid4()),'expectedRevision':1,'dataBase64':base64.b64encode(raw.getvalue()).decode()}
        me=self.s.atomic(self.mid,'avatar',b,lambda:self.s.avatar(self.mid,b));mime,data=self.s.avatar_bytes(self.mid,me['avatarId'])
        self.assertEqual(mime,'image/jpeg');self.assertEqual(Image.open(io.BytesIO(data)).size,(256,192))
        bad={'mutationId':str(uuid4()),'expectedRevision':2,'dataBase64':base64.b64encode(b'<svg></svg>').decode()}
        with self.assertRaises(DomainError):self.s.atomic(self.mid,'bad-avatar',bad,lambda:self.s.avatar(self.mid,bad))
        other,_,_=self.account('private-avatar@safina.test');b={'mutationId':str(uuid4()),'expectedRevision':2,'communityVisible':False}
        self.s.atomic(self.mid,'profile',b,lambda:self.s.profile_update(self.mid,b))
        with self.assertRaises(DomainError):self.s.avatar_bytes(other,me['avatarId'])
    def test_moderation_role_and_withdrawal(self):
        self.toggle();c=Community(self.s);id=c.feed(self.mid,'daily','2026-09-30')['items'][0]['id']
        b={'mutationId':str(uuid4()),'targetId':id,'action':'hide','reason':'review'}
        with self.assertRaises(DomainError):self.s.atomic(self.mid,'moderation',b,lambda:c.moderate(self.mid,b))
        self.store.db.execute("UPDATE accounts SET role='moderator' WHERE member_id=?",(self.mid,));self.s.atomic(self.mid,'moderation',b,lambda:c.moderate(self.mid,b))
        self.assertFalse(c.feed(self.mid,'daily','2026-09-30')['items'])
        self.assertTrue(self.s.state(self.mid)['acts'])
    def test_private_media_expiration_member_and_prerequisite(self):
        l=Learning(self.s,self.config);course=self.course();course['modules'][0]['lessons'][0]['video']={'storageBucket':'private','storagePath':'course/lesson.mp4','rightsReviewed':True};l.publish_course(course)
        url=l.lesson_detail(self.mid,'test','l1')['playback']['url'];ticket=url.split('ticket=')[1]
        other,_,_=self.account('video@safina.test')
        with self.assertRaises(DomainError):l.media_url(other,ticket)
        with self.assertRaises(DomainError) as e:l.media_url(self.mid,ticket)
        self.assertEqual(e.exception.code,'MEDIA_DELIVERY_NOT_CONFIGURED')
        self.at+=timedelta(minutes=6)
        with self.assertRaises(DomainError) as e:l.media_url(self.mid,ticket)
        self.assertEqual(e.exception.code,'MEDIA_URL_EXPIRED')
    def test_library_review_search_and_entitlement(self):
        l=Learning(self.s,self.config)
        item={'id':'lib','version':1,'title':'مراجعة اختبار','tags':['تعلم'],'transcript':'نص تجريبي','url':None,'published':True,'rightsReviewed':False,'editorialReviewed':True,'sandbox':True}
        with self.assertRaises(DomainError):l.publish_library(item)
        item['rightsReviewed']=True;l.publish_library(item)
        self.assertEqual(len(l.library(self.mid,'مراجعة')['items']),1);self.assertFalse(l.library(self.mid,'غير موجود')['items'])
    def test_learning_draft_relocks_and_revoked_access(self):
        l=Learning(self.s,self.config);c=self.course();c['free']=False;l.publish_course(c)
        with self.assertRaises(DomainError):l.detail(self.mid,'test')
        self.store.db.execute('INSERT INTO enrollments VALUES(?,?,?,NULL)',(self.mid,'test','active'))
        b={'mutationId':str(uuid4()),'expectedRevision':0,'courseVersion':1,'positionSeconds':0,'completed':True};l.write_lesson(self.mid,'test','l1','progress',b)
        a={'mutationId':str(uuid4()),'expectedRevision':0,'courseVersion':1,'answers':{'q':'test'}};l.answers(self.mid,'test','m1',a,True)
        self.assertTrue(l.detail(self.mid,'test')['modules'][1]['accessible'])
        l.answers(self.mid,'test','m1',{**a,'expectedRevision':1},False)
        with self.assertRaises(DomainError):l.lesson_detail(self.mid,'test','l2')
        self.store.db.execute("UPDATE enrollments SET status='revoked'")
        with self.assertRaises(DomainError):l.write_lesson(self.mid,'test','l1','progress',{**b,'expectedRevision':1})

    def test_monthly_khatma_completion_week_and_correction_withdrawal(self):
        self.at=datetime(2026,9,1,12,tzinfo=timezone.utc)
        member,_,_=self.account('monthly@safina.test','BJ1')
        for day in range(1,31):
            self.at=datetime(2026,9,day,12,tzinfo=timezone.utc)
            a=self.s.today(member)['assignment'];self.partial(a['eligibleRanges'],member)
        community=Community(self.s);card=community.feed(member,'weekly','2026-09-27')['items'][0]
        self.assertEqual(len(card['quranKhatmas']),1)
        self.assertEqual(card['quranKhatmas'][0]['completedOn'],'2026-09-30')
        self.assertIn('earlier_week',card['quranKhatmas'][0]['attribution'])
        self.assertLess(card['uniqueVerseCount'],len(REF.all))
        act=next(a for a in self.s.state(member)['acts'].values() if a['assignmentDay']=='2026-09-01')
        body={'mutationId':str(uuid4()),'expectedRevision':act['revision'],'reason':'Correct inaccurate original report'}
        self.s.mutate(member,'retract',body,act['id'])
        self.assertEqual(community.feed(member,'weekly','2026-09-27')['items'][0]['quranKhatmas'],[])
    def test_outside_program_correction_cannot_make_public_khatma(self):
        self.partial([{'start':'2:1','end':'2:10'}])
        act=list(self.s.state(self.mid)['acts'].values())[0]
        body={'mutationId':str(uuid4()),'expectedRevision':1,'reason':'Actual supplemental reading','ruleVersion':act['ruleVersion'],'referenceVersion':act['referenceVersion'],'ranges':[{'start':'1:1','end':'114:6'}]}
        self.s.mutate(self.mid,'correct',body,act['id'])
        card=Community(self.s).feed(self.mid,'weekly','2026-09-27')['items'][0]
        self.assertEqual(card['ranges'],[{'start':'2:1','end':'2:286'}]);self.assertFalse(card['quranKhatmas'])

# Share setup and helpers without running the base test cases twice.
for _name in list(ConnectedTests.__dict__):
    if _name.startswith('test_'):setattr(ExtendedConnectedTests,_name,None)
