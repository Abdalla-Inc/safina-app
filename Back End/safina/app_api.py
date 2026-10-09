"""Same-origin connected API. Opaque HttpOnly sessions; provider secrets stay server-side."""
import json
import re
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import parse_qs,urlsplit,unquote
from .store import Store
from .connected import ConnectedService
from .community import Community
from .learning import Learning
from .identity import Identity,AR
from .domain import DomainError,REF
from .policy_v2 import mecca_day,week


def dispatch(s,config,member,method,path,q,body):
    if path.startswith('/admin/'):s.require_founder(member)
    if path=='/me/profile':path='/me'
    c=Community(s);learning=Learning(s,config)
    def query(k,default=None):return q.get(k,[default])[0]
    def number(k,default):
        try:return int(query(k,str(default)))
        except (TypeError,ValueError):raise DomainError('INVALID_QUERY','قيمة الطلب غير صالحة.')
    if method=='GET':
        routes={'/admin/ship-preview':lambda:s.admin_ship_preview(member),'/me':lambda:s.me(member),'/me/commitment':lambda:s.commitment(member),'/me/commitment-history':lambda:s.commitment(member),'/program-rules':lambda:s.current_rules(member),
                '/community/context':s.context,'/today':lambda:s.today(member,query('date')),
                '/calendar':lambda:s.calendar(member,query('start'),query('end')),
                '/ship-visual-state':lambda:s.ship_visual(member),'/capabilities':s.capabilities,'/ship-progress':lambda:s.ship(member),'/khatmas':lambda:s.khatmas(member),
                '/reader':lambda:s.reader_get(member),'/me/export':lambda:s.export(member),
                '/community/daily':lambda:c.feed(member,'daily',query('day',mecca_day(s.now())),query('cursor'),number('limit',20)),
                '/community/weekly':lambda:c.feed(member,'weekly',query('weekStart',week(mecca_day(s.now()))['weekStart']),query('cursor'),number('limit',20)),
                '/community/changes':lambda:c.changes(member,number('after',0),number('limit',50)),
                '/me/community/daily':lambda:c.own_post(member,query('day',mecca_day(s.now()))),
                '/me/community/weeks':lambda:c.own_weeks(member,query('before'),number('limit',12)),
                '/learning/courses':lambda:learning.catalog(member,query('cursor'),number('limit',20)),'/learning/library':lambda:learning.library(member,query('q',''),query('cursor'),number('limit',20)),
                '/quran/reference':lambda:REF.data,
                '/me/reading-acts':lambda:{'items':[a for a in s.state(member)['acts'].values() if a.get('assignmentDay',a['occurrenceDate'])==query('day')],'visibility':'private'}}
        if path in routes:return routes[path]()
        m=re.fullmatch(r'/me/community/weeks/(\d{4}-\d{2}-\d{2})/days',path)
        if m:return c.own_days(member,m[1])
        m=re.fullmatch(r'/learning/courses/([^/]+)',path)
        if m:return learning.detail(member,m[1])
        m=re.fullmatch(r'/learning/courses/([^/]+)/lessons/([^/]+)',path)
        if m:return learning.lesson_detail(member,m[1],m[2])
        if path=='/moderation/reports':
            if not s.me(member)['permissions']['moderate']:raise DomainError('FORBIDDEN','هذه الصفحة للمشرفين فقط.',403)
            return {'items':[dict(r) for r in s.store.db.execute('SELECT * FROM community_reports ORDER BY created_at DESC LIMIT 100')]}
    actions={('PUT','/admin/ship-preview'):lambda:s.admin_ship_preview_put(member,body),('DELETE','/admin/ship-preview'):lambda:s.admin_ship_preview_put(member,body,True),('PUT','/me/custom-wird'):lambda:s.custom_wird_put(member,body),('PATCH','/me'):lambda:s.profile_update(member,body),('PUT','/me/avatar'):lambda:s.avatar(member,body),
             ('DELETE','/me/avatar'):lambda:s.avatar(member,body,True),('PUT','/reader'):lambda:s.reader_put(member,body),
             ('POST','/today/custom'):lambda:s.custom(member,body),('PUT','/today/istighfar'):lambda:s.istighfar_put(member,body),('PUT','/me/istighfar-goal'):lambda:s.goal_put(member,body),('POST','/today/partial'):lambda:s.partial(member,body),('POST','/me/deletion'):lambda:s.request_deletion(member,body)}
    action=actions.get((method,path))
    m=re.fullmatch(r'/today/components/([^/]+)',path)
    if m and method=='PUT':action=lambda:s.component(member,m[1],body)
    custom=re.fullmatch(r'/custom-readings/([^/]+)(/retract)?',path)
    if custom and ((method=='PATCH' and not custom[2]) or (method=='POST' and custom[2])):action=lambda:s.custom_correct(member,custom[1],body,bool(custom[2]))
    reaction=re.fullmatch(r'/community/(daily|weekly)/([^/]+)/reaction',path)
    if reaction and method=='PUT':action=lambda:c.reaction(member,reaction[1],reaction[2],body)
    lesson=re.fullmatch(r'/learning/courses/([^/]+)/lessons/([^/]+)/(progress|note|bookmark)',path)
    if lesson and method=='PUT':action=lambda:learning.write_lesson(member,lesson[1],lesson[2],lesson[3],body)
    answers=re.fullmatch(r'/learning/courses/([^/]+)/modules/([^/]+)/answers(/submit)?',path)
    if answers and method in ('PUT','POST'):
        if (method=='POST')!=bool(answers[3]):raise DomainError('NOT_FOUND','الطلب غير متاح.',404)
        action=lambda:learning.answers(member,answers[1],answers[2],body,bool(answers[3]))
    if path=='/community/reports' and method=='POST':action=lambda:c.report(member,body)
    if path=='/moderation/actions' and method=='POST':action=lambda:c.moderate(member,body)
    if action:return s.atomic(member,method+path,body,action)
    if method=='POST' and path in ('/me/commitment','/commitment-changes'):return s.mutate(member,'change',body)
    # Corrections use the immutable original assignment/rule version; cannot claim another account's acts.
    correction=re.fullmatch(r'/reading-acts/([^/]+)(/retract)?',path)
    if correction and ((method=='PATCH' and not correction[2]) or (method=='POST' and correction[2])):
        return s.mutate(member,'retract' if correction[2] else 'correct',body,correction[1])
    raise DomainError('NOT_FOUND','الصفحة المطلوبة غير موجودة.',404)


def make_server(db_path,config,host='127.0.0.1',port=8766,clock=None):
    if host not in ('127.0.0.1','localhost','::1'):raise ValueError('Use a TLS reverse proxy; backend binds loopback only.')
    migrated=Store(db_path)
    providers={r[0] for r in migrated.db.execute('SELECT DISTINCT provider FROM accounts')}
    if providers-{config.mode}:
        migrated.close();raise ValueError('Use a separate database for sandbox and live identity. Never promote sandbox accounts.')
    # Upgrade old stored cards before advertising the new response contract.
    # This touches projections only; assignment snapshots and evidence stay immutable.
    try:
        with migrated.transaction():
            version=migrated.db.execute("SELECT version FROM projection_versions WHERE name='community'").fetchone()
            if not version or version['version']!='0.5.0':
                service=ConnectedService(migrated,now=clock,signing_key=config.key)
                for row in migrated.db.execute('SELECT member_id FROM accounts').fetchall():Community(service).rebuild(row['member_id'])
                migrated.db.execute("INSERT INTO projection_versions VALUES('community','0.5.0',?) ON CONFLICT(name) DO UPDATE SET version=excluded.version,rebuilt_at=excluded.rebuilt_at",(service.timestamp(),))
    finally:migrated.close()
    class Handler(BaseHTTPRequestHandler):
        server_version='Safina/0.6'
        def log_message(self,*args):pass
        def cookie(self,name,value,max_age=604800):
            return f'{name}={value}; Path=/api/v1; HttpOnly; SameSite=Lax; Max-Age={max_age}'+('; Secure' if config.secure else '')
        def reply(self,status,value=None,headers=None,raw=None,mime=None):
            data=raw if raw is not None else json.dumps(value,ensure_ascii=False,allow_nan=False).encode()
            self.send_response(status)
            for key,val in [('Content-Type',mime or 'application/json; charset=utf-8'),('Cache-Control','no-store'),('X-Content-Type-Options','nosniff'),('Referrer-Policy','no-referrer'),('Content-Length',str(len(data))),*(headers or [])]:self.send_header(key,val)
            self.end_headers();self.wfile.write(data)
        def request(self):
            store=None;self.connection.settimeout(15)
            try:
                url=urlsplit(self.path);q=parse_qs(url.query);path=unquote(url.path)
                if not path.startswith('/api/v1/') or len(self.path)>8192 or any(len(v)!=1 for v in q.values()):raise DomainError('INVALID_QUERY','الطلب غير صالح.')
                path=path[len('/api/v1'):];write=self.command!='GET'
                if self.command=='GET' and path=='/health':return self.reply(200,{'status':'ok','mode':config.mode,'contractVersion':'0.6.0','capabilities':ConnectedService.capabilities(),'googleConfigured':config.mode=='supabase'})
                if self.headers.get('Sec-Fetch-Site')=='cross-site' and path!='/auth/google/callback':raise DomainError('ORIGIN_REJECTED','مصدر الطلب غير مسموح.',403)
                if write and self.headers.get('Origin')!=config.origin:raise DomainError('ORIGIN_REJECTED','مصدر الطلب غير مسموح.',403)
                body={}
                if write:
                    if self.headers.get('Transfer-Encoding'):raise DomainError('INVALID_BODY','الطلب غير صالح.')
                    try:length=int(self.headers.get('Content-Length','0'))
                    except ValueError:raise DomainError('INVALID_BODY','الطلب غير صالح.')
                    maximum=14001000 if path=='/me/avatar' else 131072
                    if not 0<length<=maximum:raise DomainError('BODY_TOO_LARGE','حجم الطلب أكبر من المسموح.',413)
                    if self.headers.get_content_type()!='application/json':raise DomainError('UNSUPPORTED_MEDIA_TYPE','الطلب يجب أن يكون JSON.',415)
                    def unique(pairs):
                        out={}
                        for key,val in pairs:
                            if key in out:raise ValueError()
                            out[key]=val
                        return out
                    try:body=json.loads(self.rfile.read(length),object_pairs_hook=unique,parse_constant=lambda _:(_ for _ in ()).throw(ValueError()))
                    except (ValueError,UnicodeDecodeError):raise DomainError('INVALID_JSON','تعذّر قراءة الطلب.')
                    if not isinstance(body,dict):raise DomainError('INVALID_BODY','الطلب غير صالح.')
                cookies=SimpleCookie();cookies.load(self.headers.get('Cookie',''))
                token=cookies['safina_session'].value if 'safina_session' in cookies else None
                csrf=self.headers.get('X-CSRF-Token')
                store=Store(db_path);s=ConnectedService(store,now=clock,signing_key=config.key);identity=Identity(s,config)
                if path.startswith('/auth/'):
                    if write:identity.rate_limit('auth:'+self.client_address[0],maximum=30,seconds=60)
                    if path=='/auth/session' and not write:return self.reply(200,identity.session_view(token))
                    if path=='/auth/google/callback' and not write:
                        flow=cookies['safina_flow'].value if 'safina_flow' in cookies else None
                        try:result,new=identity.google_callback(flow,q.get('code',[None])[0])
                        except DomainError as error:
                            code='ONBOARDING_REQUIRED' if error.code=='ONBOARDING_REQUIRED' else 'AUTH_FAILED'
                            return self.reply(303,{},[('Set-Cookie',self.cookie('safina_flow','',0)),('Location',config.origin+'/?authError='+code+'#/account')])
                        return self.reply(303,{},[('Set-Cookie',self.cookie('safina_session',new)),('Set-Cookie',self.cookie('safina_flow','',0)),('Location',config.origin+'/#/account')])
                    if self.command!='POST':raise DomainError('NOT_FOUND','الطلب غير متاح.',404)
                    simple={'/auth/register':identity.register,'/auth/recover':identity.recover,'/auth/reset-password':identity.reset_password}
                    if path in simple:return self.reply(200,simple[path](body))
                    if path in ('/auth/login','/auth/verify','/auth/refresh'):
                        result,new=identity.refresh(token,csrf) if path.endswith('refresh') else (identity.login(body) if path.endswith('login') else identity.verify(body))
                        return self.reply(200,result,[('Set-Cookie',self.cookie('safina_session',new))])
                    if path=='/auth/logout':return self.reply(200,identity.logout(token,csrf),[('Set-Cookie',self.cookie('safina_session','',0))])
                    if path=='/auth/google':
                        result,flow=identity.google_start(body);return self.reply(200,result,[('Set-Cookie',self.cookie('safina_flow',flow,600))])
                    raise DomainError('NOT_FOUND','الطلب غير متاح.',404)
                session=identity.session(token,csrf,write);member=session['member_id']
                if write:identity.rate_limit('member:'+member,maximum=120,seconds=60)
                if not write:
                    with store.transaction():
                        if path.startswith('/assets/avatar/'):
                            mime,data=s.avatar_bytes(member,path.rsplit('/',1)[1]);return self.reply(200,raw=data,mime=mime)
                        thumb=re.fullmatch(r'/learning/courses/([^/]+)(?:/lessons/([^/]+))?/thumbnail',path)
                        if thumb:return self.reply(303,{},[('Location',Learning(s,config).thumbnail_url(member,*thumb.groups()))])
                        caption=re.fullmatch(r'/learning/courses/([^/]+)/lessons/([^/]+)/captions/([^/]+)',path)
                        if caption:return self.reply(303,{},[('Location',Learning(s,config).caption_url(member,*caption.groups()))])
                        resource=re.fullmatch(r'/learning/courses/([^/]+)/lessons/([^/]+)/resources/([^/]+)',path)
                        if resource:return self.reply(303,{},[('Location',Learning(s,config).resource_url(member,*resource.groups()))])
                        if path=='/media/playback':return self.reply(303,{},[('Location',Learning(s,config).media_url(member,q.get('ticket',[''])[0]))])
                        result=dispatch(s,config,member,self.command,path,q,body)
                else:result=dispatch(s,config,member,self.command,path,q,body)
                self.reply(200,result,[('Set-Cookie',self.cookie('safina_session','',0))] if path=='/me/deletion' else [])
            except DomainError as e:
                data=e.body();data['error']['message']=AR.get(e.code,data['error']['message'])
                if data['error']['message'].isascii():data['error']['message']='تعذّر قبول الطلب. راجع البيانات أو حدّث الصفحة.'
                self.reply(e.status,data)
            except (KeyError,TypeError,ValueError):self.reply(422,{'error':{'code':'INVALID_REQUEST','message':'راجع الحقول المطلوبة وقيمها.'}})
            except Exception:
                import sys
                print("Safina connected request failed internally",file=sys.stderr)
                self.reply(500,{'error':{'code':'INTERNAL_ERROR','message':'تعذّر إتمام الطلب. أعد المحاولة لاحقاً.'}})
            finally:
                if store:store.close()
        do_GET=do_POST=do_PUT=do_PATCH=do_DELETE=request
    return ThreadingHTTPServer((host,port),Handler)
