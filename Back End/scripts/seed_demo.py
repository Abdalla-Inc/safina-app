"""Seed explicitly synthetic local members, never real accounts or external content."""
import json
import os
import secrets
from datetime import datetime,timezone
from pathlib import Path
from uuid import uuid4
from safina.domain import ROOT,REF,RULE_VERSION
from safina.service import Service
from safina.store import Store

def main():
    os.umask(0o077);folder=ROOT/'local';folder.mkdir(exist_ok=True);db=folder/'demo.sqlite3'
    if db.exists():raise SystemExit('Demo database already exists; retained without changes.')
    store=Store(db);service=Service(store);credentials={'synthetic':True,'baseUrl':'http://127.0.0.1:8765','members':{}}
    for tier in ('B','BI','BJ1','BJ2','BJ3','BJ4','BJ5'):
        member='demo-'+tier;credentials['members'][member]=service.provision(member,tier,'Australia/Brisbane','2026-09-01')['token']
    a=service.today('demo-BJ2','2026-09-01')['assignment']
    body={'mutationId':str(uuid4()),'logicalActId':str(uuid4()),'occurrenceDate':'2026-09-01','occurredAt':'2026-09-01T09:00:00+10:00',
          'timezone':'Australia/Brisbane','utcOffsetMinutes':600,'ranges':[{'start':'2:1','end':'2:286'}],'source':'manual_physical',
          'assignmentId':a['id'],'ruleVersion':RULE_VERSION,'referenceVersion':REF.version}
    service.mutate('demo-BJ2','reading',body)
    (folder/'demo-access.json').write_text(json.dumps(credentials,indent=2)+'\n')
    (folder/'demo-signing-key').write_text(secrets.token_urlsafe(48))
    store.close();print('Synthetic demo database and private credentials saved under local/.')
if __name__=='__main__':main()
