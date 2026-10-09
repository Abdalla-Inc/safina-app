"""Service-generated launch acceptance examples, never imported into live accounts."""
import json,tempfile
from pathlib import Path
from datetime import datetime,timezone
from uuid import uuid4
from safina.domain import ROOT
from safina.store import Store
from safina.identity import Identity,Config
from safina.connected import ConnectedService
from safina.contracts import validate

def main():
    doc=json.loads((ROOT/'contracts/connected.schema.json').read_text())
    with tempfile.TemporaryDirectory() as directory:
        store=Store(Path(directory)/'fixtures.db');s=ConnectedService(store,now=lambda:datetime(2026,10,1,8,tzinfo=timezone.utc))
        auth=Identity(s,Config(b'x'*48));auth.register(dict(email='fixture-owner@example.test',password='fixture-password-only',displayName='مثال ورد مخصص',tier='CUSTOM',customWird=dict(period='weekly',selections=[dict(surahId=36,fromAyah=1,toAyah=83)]),communityAcknowledged=True,countryCode='SD',istighfarGoal=100))
        member=store.db.execute('SELECT member_id FROM accounts').fetchone()[0];store.db.execute("UPDATE accounts SET role='founder'")
        examples={'launch-custom-me':('Me',s.me(member)),'launch-custom-today':('Today',s.today(member)),'launch-ship-construction':('ShipVisual',s.ship_visual(member)),
                  'launch-admin-preview':('AdminShipPreview',s.admin_ship_preview_put(member,dict(mutationId=str(uuid4()),expectedRevision=0,buildStep=30,health=45,celebration=True)))}
        for name,(schema,value) in examples.items():
            validate(value,schema,doc)
            (ROOT/'contracts/connected-fixtures'/f'{name}.json').write_text(json.dumps(dict(schema=schema,fixture=value),ensure_ascii=False,indent=2)+'\n')
        store.close()
    print('Validated four service-generated launch fixtures.')
if __name__=='__main__':main()
