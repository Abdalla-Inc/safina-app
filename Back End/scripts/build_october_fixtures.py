"""New v0.5 examples generated from real domain mutations in a disposable database."""
import json,tempfile
from pathlib import Path
from datetime import datetime,timedelta,timezone
from uuid import uuid4
from safina.domain import ROOT,REF
from safina.store import Store
from safina.identity import Config,Identity
from safina.connected import ConnectedService
from safina.community import Community
from safina.contracts import validate

def build():
    doc=json.loads((ROOT/'contracts/connected.schema.json').read_text());out=ROOT/'contracts/connected-fixtures'
    def save(name,schema,value):
        validate(value,schema,doc);(out/(name+'.json')).write_text(json.dumps({'schema':schema,'fixture':value},ensure_ascii=False,indent=2)+'\n')
    with tempfile.TemporaryDirectory() as tmp:
        at=[datetime(2026,9,30,12,tzinfo=timezone.utc)];store=Store(Path(tmp)/'db');s=ConnectedService(store,now=lambda:at[0]);auth=Identity(s,Config(b'x'*48))
        auth.register(dict(email='october@fixtures.test',password='fictional-fixture-password',displayName='عضو اختبار باسم طويل بلا صورة شخصية',tier='B',communityAcknowledged=True,countryCode='AU',istighfarGoal=100));m=store.db.execute('SELECT member_id FROM accounts').fetchone()[0];c=Community(s)
        def write(name,b,fn):
            b={'mutationId':str(uuid4()),**b};return s.atomic(m,name,b,lambda:fn(m,b))
        occurrence=lambda:dict(occurredAt=at[0].isoformat(),occurrenceDate=at[0].date().isoformat(),timezone='UTC',utcOffsetMinutes=0)
        request=dict(mutationId=str(uuid4()),referenceVersion=REF.version,selection=dict(kind='juz',**{'from':1,'to':1}),**occurrence());save('october-custom-request','CustomPost',request)
        first=write('custom',request,s.custom);save('october-custom-result','CustomResult',first)
        dhikr=write('dhikr',dict(expectedRevision=0,count=50,day='2026-09-30',**occurrence()),s.istighfar_put);save('october-istighfar-result','IstighfarResult',dhikr)
        save('october-mixed-daily','DailyFeed',c.feed(m,'daily','2026-09-30'));save('october-mixed-weekly','WeeklyFeed',c.feed(m,'weekly','2026-09-27'))
        card=c.feed(m,'daily','2026-09-30')['items'][0]
        reaction=write('reaction',dict(expectedRevision=0,emoji='👏'),lambda member,body:c.reaction(member,'daily',card['id'],body));save('october-reaction','Reaction',reaction)
        corrected=write('custom-correct',dict(expectedRevision=1,referenceVersion=REF.version,ranges=[{'start':'1:1','end':'1:7'}],reason='Fixture correction'),lambda member,body:s.custom_correct(member,first['groupId'],body));save('october-corrected-custom','CustomResult',corrected)
        write('custom-retract',dict(expectedRevision=2,reason='Fixture retraction'),lambda member,body:s.custom_correct(member,first['groupId'],body,True))
        save('october-dhikr-only','DailyFeed',c.feed(m,'daily','2026-09-30'))
        write('zero',dict(expectedRevision=1,count=0,day='2026-09-30',**occurrence()),s.istighfar_put)
        save('october-withdrawn','OwnDaily',c.own_post(m,'2026-09-30'));save('october-private-history','OwnDays',c.own_days(m,'2026-09-27'))
        at[0]+=timedelta(days=1)
        body=dict(mutationId=str(uuid4()),expectedCommitmentId=s.commitment(m)['effective']['id'],tier='BI',ruleVersion=s.current_rules(m)['version'])
        s.mutate(m,'change',body);save('october-level-history','Me',s.me(m))
        save('october-ship-pending','ShipVisual',s.ship_visual(m));save('october-capabilities','Capabilities',s.capabilities())
        save('october-reading-audit','ReadingList',{'items':list(s.state(m)['acts'].values()),'visibility':'private'})
        store.close()
    print('October activity, history, reaction and ship fixtures validated.')
if __name__=='__main__':build()
