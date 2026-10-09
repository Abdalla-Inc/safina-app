import argparse
import json
import os
from pathlib import Path
from .api import make_server
from .domain import TIERS
from .service import Service
from .store import Store
from .modules import Modules

def main():
    os.umask(0o077)
    p=argparse.ArgumentParser(description='Safina local backend; no external deployment.')
    p.add_argument('--db',default='local/safina.sqlite3')
    sub=p.add_subparsers(dest='command',required=True)
    sub.add_parser('init')
    m=sub.add_parser('member');m.add_argument('id');m.add_argument('--tier',choices=TIERS,required=True);m.add_argument('--timezone',required=True);m.add_argument('--start-date',required=True)
    s=sub.add_parser('serve');s.add_argument('--port',type=int,default=8765)
    r=sub.add_parser('replay');r.add_argument('member')
    d=sub.add_parser('draft');d.add_argument('kind');d.add_argument('id');d.add_argument('json_file');d.add_argument('--revision',type=int,default=1)
    args=p.parse_args();Path(args.db).parent.mkdir(parents=True,exist_ok=True)
    if args.command=='serve':
        key=os.environ.get('SAFINA_SIGNING_KEY');server=make_server(args.db,port=args.port,signing_key=key.encode() if key else None)
        print(f'Safina local API: http://127.0.0.1:{args.port}',flush=True)
        try:server.serve_forever()
        except KeyboardInterrupt:pass
        finally:server.server_close()
        return
    store=Store(args.db);service=Service(store)
    try:
        if args.command=='member':result=service.provision(args.id,args.tier,args.timezone,args.start_date)
        elif args.command=='replay':result=service.replay(args.member)
        elif args.command=='draft':result=Modules(store).save_draft(args.kind,args.id,json.loads(Path(args.json_file).read_text()),args.revision)
        else:result={'migrated':True,'database':args.db}
        print(json.dumps(result,ensure_ascii=False,indent=2))
    finally:store.close()
if __name__=='__main__':main()
