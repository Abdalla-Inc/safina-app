"""Create an explicitly fictional LOCAL owner demonstration; never runs in live mode."""
import json,os,secrets
from datetime import datetime,timedelta,timezone
from uuid import uuid5,NAMESPACE_URL
from safina.domain import ROOT,REF
from safina.store import Store
from safina.connected import ConnectedService
from safina.identity import Identity
from safina.connected_cli import configuration

def main():
    os.umask(0o077);directory=ROOT/'local';directory.mkdir(exist_ok=True);config=configuration(directory)
    if config.mode!='sandbox':raise ValueError('Owner demo is local sandbox only. Do not import into live accounts.')
    config.super_admin_email='gubaraabdalla@gmail.com'
    db=Store(directory/'connected.sqlite3');now=datetime.now(timezone.utc);at=[now]
    s=ConnectedService(db,now=lambda:at[0],signing_key=config.key);auth=Identity(s,config)
    path=directory/'owner-demo-access.json';saved=json.loads(path.read_text()) if path.exists() else {'mode':'sandbox','fictionalExamples':True,'accounts':[]}
    existing={a['email']:a for a in saved['accounts']}
    names=['أحمد','مريم','عمر','فاطمة','يوسف','خديجة','إبراهيم','آمنة','حسن','زينب','خالد','سمية','عبد الرحمن','سارة']
    for i in range(15):
        owner=i==14;address=config.super_admin_email if owner else f'launch-example-{i+1:02}@safina.test'
        at[0]=now-timedelta(days=7)
        if not db.db.execute('SELECT 1 FROM accounts WHERE email=?',(address,)).fetchone():
            pw=secrets.token_urlsafe(18);intent=dict(email=address,password=pw,displayName='عبد الله' if owner else names[i]+' — مثال',tier='B' if owner else ('B','BI','CUSTOM')[i%3],communityAcknowledged=True,countryCode=('SD','AU','SA','EG','GB','PS','MY')[i%7],istighfarGoal=(100,200,500)[i%3])
            if intent['tier']=='CUSTOM':intent['customWird']=dict(period='weekly' if i%2 else 'monthly',selections=[dict(surahId=36,fromAyah=1,toAyah=83)])
            auth.register(intent);db.db.execute('UPDATE sandbox_identities SET verified=1 WHERE email=?',(address,))
            existing[address]={'email':address,'password':pw,'role':'founder' if owner else 'member','example':not owner}
        mid=db.db.execute('SELECT member_id FROM accounts WHERE email=?',(address,)).fetchone()[0]
        if address in existing:existing[address]['tier']=s.commitment(mid)['effective']['tier']
        if owner:
            at[0]=now
            # Local mailbox verification above; promote through the same verified login flow.
            if address in existing:auth.login(dict(email=address,password=existing[address]['password']))
            continue
        for offset in (5,3,1,0):
            at[0]=now-timedelta(days=offset)
            occurrence=dict(occurredAt=at[0].isoformat(),occurrenceDate=at[0].date().isoformat(),timezone='UTC',utcOffsetMinutes=0)
            day=s.context()['day']
            def write(name,body,fn):
                body={'mutationId':str(uuid5(NAMESPACE_URL,mid+day+name)),**body}
                prior=db.db.execute('SELECT response FROM mutations WHERE member_id=? AND mutation_id=?',(mid,body['mutationId'])).fetchone()
                if prior:return json.loads(prior['response'])
                return s.atomic(mid,name,body,lambda:fn(mid,body))
            write('demo-istighfar',dict(day=day,expectedRevision=0,count=(50,100,250,500)[(i+offset)%4],**occurrence),s.istighfar_put)
            # Explicit sample Quran reports; Saturday is voluntary and never earns a step.
            write('demo-reading',dict(referenceVersion=REF.version,selection=dict(kind='surah',surahId=36,fromAyah=1,toAyah=20+i),**occurrence),s.custom)
            today=s.today(mid)
            if offset and i%4!=3:
                for component in today['assignment']['components']:
                    fresh=s.today(mid)
                    write('demo-complete-'+component['id'],dict(assignmentId=fresh['assignment']['id'],expectedInputHash=fresh['evaluation']['inputHash'],completed=True,**occurrence),lambda m,b:s.component(m,component['id'],b))
    saved['accounts']=sorted(existing.values(),key=lambda a:(a['role']!='founder',a['email']));path.write_text(json.dumps(saved,ensure_ascii=False,indent=2)+'\n');path.chmod(0o600)
    db.close();print('Local owner and 14 fictional members prepared. Private login file: '+str(path))
if __name__=='__main__':main()
