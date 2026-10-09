"""Generate consumer fixtures in an ephemeral sandbox; never imports browser or real records."""
import json,tempfile
from datetime import datetime,timedelta,timezone
from pathlib import Path
from uuid import uuid4
from safina.domain import ROOT
from safina.store import Store
from safina.connected import ConnectedService
from safina.community import Community
from safina.identity import Config,Identity
from safina.learning import Learning
from safina.contracts import validate

def build():
    destination=ROOT/'contracts/connected-fixtures';destination.mkdir(exist_ok=True)
    document=json.loads((ROOT/'contracts/connected.schema.json').read_text())
    def save(name,schema,value):
        try:validate(value,schema,document)
        except Exception as e:print(name,getattr(e,'details',{}));raise
        (destination/(name+'.json')).write_text(json.dumps({'schema':schema,'fixture':value},ensure_ascii=False,indent=2)+'\n')
    with tempfile.TemporaryDirectory() as tmp:
        at=[datetime(2026,9,30,12,tzinfo=timezone.utc)];store=Store(Path(tmp)/'fixtures.db');service=ConnectedService(store,now=lambda:at[0]);config=Config(b'fixture-only-key-not-a-live-secret'+b'x'*16);auth=Identity(service,config)
        def account(tier):
            address=tier.lower()+'@fixtures.test';auth.register({'email':address,'password':'fixture-only-password','displayName':'Example '+tier,'tier':tier,'communityAcknowledged':True,'countryCode':'SD','istighfarGoal':100})
            code=json.loads(store.db.execute('SELECT payload FROM sandbox_mailbox WHERE email=?',(address,)).fetchone()[0])['code'];session,_=auth.verify({'email':address,'code':code});return session['memberId']
        mids={tier:account(tier) for tier in ('B','BI','BJ1','BJ2','BJ3','BJ4','BJ5')};member=mids['BI'];c=Community(service)
        for tier,mid in mids.items():save('today-'+tier,'Today',service.today(mid))
        save('profile','Me',service.me(member));save('reader','Reader',service.reader_get(member));save('context','Context',service.context());save('empty-weeks','OwnWeeks',c.own_weeks(member))
        def partial(ranges):
            today=service.today(member);body={'mutationId':str(uuid4()),'assignmentId':today['assignment']['id'],'expectedInputHash':today['evaluation']['inputHash'],'ranges':ranges,'occurredAt':at[0].isoformat(),'occurrenceDate':at[0].date().isoformat(),'timezone':'UTC','utcOffsetMinutes':0}
            return service.atomic(member,'partial',body,lambda:service.partial(member,body))
        save('partial-result','ReadingResult',partial([{'start':'2:1','end':'2:10'}]));save('partial-weekly','WeeklyFeed',c.feed(member,'weekly','2026-09-27'))
        save('complete-component-result','ReadingResult',partial([{'start':'2:1','end':'2:286'}]));save('daily-component','DailyFeed',c.feed(member,'daily','2026-09-30'))
        save('weekly-component','WeeklyFeed',c.feed(member,'weekly','2026-09-27'));save('own-days','OwnDays',c.own_days(member,'2026-09-27'));save('own-weeks','OwnWeeks',c.own_weeks(member));save('changes','Changes',c.changes(member))
        save('reading-list','ReadingList',{'items':list(service.state(member)['acts'].values()),'visibility':'private'})
        save('export','Export',service.export(member));learning=Learning(service,config);save('empty-catalog','Catalog',learning.catalog(member));save('empty-library','Library',learning.library(member))
        # Deliberately no videos or curriculum; this is a test of access and prerequisites only.
        course={'id':'sandbox-workflow','version':1,'title':'SANDBOX ONLY: workflow test, not teaching content','format':'weekly','thumbnail':None,'free':True,'sandbox':True,'published':True,'rightsReviewed':True,'editorialReviewed':True,'modules':[{'id':'week-'+str(n),'title':'Test week '+str(n),'lessons':[{'id':'lesson-'+str(n),'title':'Test interaction only','required':True,'thumbnail':None,'durationSeconds':0,'video':None,'resources':[],'completionPolicy':'member_confirmation','completionPolicyApproved':True}],'questions':[{'id':'test-question','prompt':'Test answer persistence only','required':True}]} for n in (1,2)]}
        learning.publish_course(course);save('catalog-sandbox','Catalog',learning.catalog(member));save('course-sandbox','Course',learning.detail(member,course['id']));save('lesson-sandbox','Lesson',learning.lesson_detail(member,course['id'],'lesson-1'))
        (destination/'sandbox-course-input.json').write_text(json.dumps({'administrativeInput':True,'fixture':course},ensure_ascii=False,indent=2)+'\n')
        at[0]+=timedelta(days=3);save('saturday','Today',service.today(member));save('saturday-context','Context',service.context());save('celebration','WeeklyFeed',c.feed(member,'weekly','2026-09-27'))
        store.close()
    print('Wrote connected fixtures, schema-validated, from an isolated temporary sandbox.')
if __name__=='__main__':build()
