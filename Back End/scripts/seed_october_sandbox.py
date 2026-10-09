"""Explicit fictional acceptance accounts, isolated from preview and live identity."""
import json,os
from datetime import datetime,timedelta,timezone
from uuid import uuid5,NAMESPACE_URL
from safina.domain import ROOT,REF
from safina.store import Store
from safina.connected import ConnectedService
from safina.identity import Identity
from safina.connected_cli import configuration

def main():
    os.umask(0o077);directory=ROOT/'local';config=configuration(directory)
    if config.mode!='sandbox':raise ValueError('Sandbox only')
    db=Store(directory/'connected.sqlite3');now=datetime.now(timezone.utc);at=[now-timedelta(days=7)]
    s=ConnectedService(db,now=lambda:at[0],signing_key=config.key);auth=Identity(s,config);access=[]
    for i,tier in enumerate(('B','BI','BJ1','BJ2','BJ3','BJ4','BJ5')):
        address=f'october-{tier.lower()}@safina.test';password='October-sandbox-only-2026';country=('SD','AU','SA','EG','GB','PS','MY')[i]
        if db.db.execute('SELECT 1 FROM accounts WHERE email=?',(address,)).fetchone():continue
        at[0]=now-timedelta(days=7)
        auth.register(dict(email=address,password=password,displayName='اختبار أكتوبر — '+('اسم طويل للتحقق من العرض بجانب البلد ' if i==2 else '')+tier,tier=tier,communityAcknowledged=True,countryCode=country,istighfarGoal=100))
        db.db.execute('UPDATE sandbox_identities SET verified=1 WHERE email=?',(address,));mid=db.db.execute('SELECT member_id FROM accounts WHERE email=?',(address,)).fetchone()[0]
        at[0]=now
        occurrence=dict(occurredAt=now.isoformat(),occurrenceDate=now.date().isoformat(),timezone='UTC',utcOffsetMinutes=0)
        def write(name,body,fn):
            body={'mutationId':str(uuid5(NAMESPACE_URL,mid+name)),**body};return s.atomic(mid,name,body,lambda:fn(mid,body))
        custom=write('custom',dict(referenceVersion=REF.version,selection=dict(kind='surah',surahId=36,fromAyah=1,toAyah=20),**occurrence),s.custom)
        if tier=='BJ5':write('withdrawn',dict(expectedRevision=1,reason='Fictional withdrawal acceptance fixture'),lambda m,b:s.custom_correct(m,custom['groupId'],b,True))
        elif tier!='B':write('istighfar',dict(expectedRevision=0,count=50 if i%2 else 150,day=s.context()['day'],**occurrence),s.istighfar_put)
        access.append(dict(email=address,password=password,tier=tier,countryCode=country))
    path=directory/'october-sandbox-access.json'
    if access:path.write_text(json.dumps({'mode':'sandbox','accounts':access},ensure_ascii=False,indent=2)+'\n');path.chmod(0o600)
    db.close();print('Sandbox fixture accounts ready; credentials in '+str(path))
if __name__=='__main__':main()
