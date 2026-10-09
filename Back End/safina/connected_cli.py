"""Local operations for the connected app. Never exposes administration through member APIs."""
import argparse,json,os,secrets
from pathlib import Path
from .store import Store
from .connected import ConnectedService
from .identity import Config,Identity,hashed,pw_hash
from .learning import Learning
from .app_api import make_server

def configuration(directory):
    mode=os.environ.get('SAFINA_AUTH_MODE','sandbox');key=os.environ.get('SAFINA_SERVER_KEY')
    if not key:
        if mode!='sandbox':raise ValueError('Set SAFINA_SERVER_KEY to a stable random secret of at least 32 bytes.')
        path=directory/'server.key'
        if not path.exists():path.write_text(secrets.token_urlsafe(48));path.chmod(0o600)
        key=path.read_text().strip()
    return Config(key.encode(),mode,os.environ.get('SAFINA_APP_ORIGIN','http://127.0.0.1:5178'),os.environ.get('SUPABASE_URL',''),os.environ.get('SUPABASE_ANON_KEY',''),os.environ.get('SAFINA_OPEN_REGISTRATION')!='1',storage_key=os.environ.get('SUPABASE_STORAGE_SERVICE_KEY',''),super_admin_email=os.environ.get('SAFINA_SUPER_ADMIN_EMAIL',''))

def main():
    os.umask(0o077);p=argparse.ArgumentParser(description='Safina connected account API')
    p.add_argument('--db',default='local/connected.sqlite3');sub=p.add_subparsers(dest='command',required=True)
    s=sub.add_parser('serve');s.add_argument('--port',type=int,default=8766)
    sub.add_parser('init');sub.add_parser('seed-sandbox')
    m=sub.add_parser('mailbox');m.add_argument('email')
    i=sub.add_parser('invite');i.add_argument('email')
    r=sub.add_parser('role');r.add_argument('email');r.add_argument('role',choices=['member','moderator','founder'])
    c=sub.add_parser('publish-course');c.add_argument('file')
    lib=sub.add_parser('publish-library');lib.add_argument('file')
    e=sub.add_parser('enroll');e.add_argument('email');e.add_argument('course');e.add_argument('--expires-at')
    media=sub.add_parser('prepare-media');media.add_argument('input');media.add_argument('output');media.add_argument('--ffmpeg',required=True);media.add_argument('--rights-reviewed',action='store_true');media.add_argument('--captions')
    sub.add_parser('rebuild-community')
    args=p.parse_args();db=Path(args.db);db.parent.mkdir(parents=True,exist_ok=True);config=configuration(db.parent)
    if args.command=='serve':
        server=make_server(db,config,port=args.port);print(f'Safina connected API ({config.mode}): http://127.0.0.1:{args.port}',flush=True)
        try:server.serve_forever()
        except KeyboardInterrupt:pass
        finally:server.server_close()
        return
    store=Store(db);s=ConnectedService(store,signing_key=config.key);auth=Identity(s,config)
    try:
        result={'ready':True,'mode':config.mode}
        if args.command=='prepare-media':
            from .media import prepare_upload
            result=prepare_upload(args.input,args.output,args.ffmpeg,args.rights_reviewed,args.captions)
        elif args.command=='seed-sandbox':
            if config.mode!='sandbox':raise ValueError('Sandbox seeding is forbidden in live mode.')
            access=[]
            for address,name,tier in [('member@safina.test','عضو تجريبي','B'),('friend@safina.test','رفيق تجريبي','BI')]:
                existing=store.db.execute('SELECT id FROM sandbox_identities WHERE email=?',(address,)).fetchone()
                if existing:continue
                pw=secrets.token_urlsafe(18);auth.register({'email':address,'password':pw,'displayName':name,'tier':tier,'communityAcknowledged':True,'countryCode':'SD','istighfarGoal':100})
                store.db.execute('UPDATE sandbox_identities SET verified=1 WHERE email=?',(address,));access.append({'email':address,'password':pw,'tier':tier})
            accessfile=db.parent/'connected-sandbox-access.json'
            if access:accessfile.write_text(json.dumps({'mode':'sandbox','accounts':access},ensure_ascii=False,indent=2));accessfile.chmod(0o600)
            result={'mode':'sandbox','accountsFile':str(accessfile),'newAccounts':len(access),'fictionalHistoryImported':False}
        elif args.command=='mailbox':
            if config.mode!='sandbox':raise ValueError('Mailbox is only a local test double.')
            result={'messages':[dict(r,payload=json.loads(r['payload'])) for r in store.db.execute('SELECT kind,payload,created_at FROM sandbox_mailbox WHERE email=? ORDER BY id DESC LIMIT 5',(args.email.strip().casefold(),))]}
        elif args.command=='invite':store.db.execute('INSERT OR IGNORE INTO auth_invites VALUES(?,NULL,?)',(hashed(args.email.strip().casefold()),s.timestamp()));result={'invited':args.email}
        elif args.command in ('role','enroll'):
            row=store.db.execute('SELECT member_id FROM accounts WHERE email=? AND status=?',(args.email.strip().casefold(),'active')).fetchone()
            if not row:raise ValueError('Active account not found.')
            if args.command=='role':store.db.execute('UPDATE accounts SET role=?,revision=revision+1 WHERE member_id=?',(args.role,row[0]));result={'role':args.role}
            else:
                Learning(s,config).course(args.course)
                if args.expires_at:
                    from .domain import instant
                    instant(args.expires_at)
                store.db.execute('INSERT OR REPLACE INTO enrollments VALUES(?,?,?,?)',(row[0],args.course,'active',args.expires_at));result={'enrolled':True}
        elif args.command in ('publish-course','publish-library'):
            with store.transaction():
                learning=Learning(s,config);data=json.loads(Path(args.file).read_text())
                result=learning.publish_course(data) if args.command=='publish-course' else learning.publish_library(data)
        elif args.command=='rebuild-community':
            from .community import Community
            with store.transaction():
                for row in store.db.execute('SELECT member_id FROM accounts').fetchall():Community(s).rebuild(row[0])
            result={'rebuilt':True,'cursor':Community(s).cursor()}
        print(json.dumps(result,ensure_ascii=False,indent=2))
    finally:store.close()
if __name__=='__main__':main()
