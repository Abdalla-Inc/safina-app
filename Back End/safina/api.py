"""Local-only JSON HTTP adapter. Replace transport/auth for production; domain stays pure."""
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
from .domain import ROOT, REF, DomainError, gate, unresolved
from .modules import Modules
from .service import Service
from .store import Store

MAX_BODY=131072

def dispatch(service,member,method,path,q,body):
    def query(name,default=None):return q.get(name,[default])[0]
    if method=='GET':
        if path=='/program-rules':return json.loads((ROOT/'data/program_rules.json').read_text())
        if path=='/today':return service.today(member,query('date'))
        if path=='/calendar':return service.calendar(member,query('start'),query('end'))
        if path=='/day-evaluation':return service.day(member,query('date'))
        if path=='/ship-progress':return service.ship(member)
        if path=='/khatmas':return service.khatmas(member)
        if path=='/offline-snapshot':return service.offline_snapshot(member,query('date'))
        if path=='/quran/reference':return REF.data
        if path=='/quran/page':
            try:page=int(query('page'))
            except (ValueError,TypeError):raise DomainError('INVALID_PAGE','Page must be an integer.')
            return REF.page(query('edition'),query('mapVersion'),page)
        if path=='/quran/text':gate('quran_assets')
        if path=='/entitlements':return Modules(service.store).entitlements()
        if path=='/library/search':gate('library_rights')
        if path=='/classroom':gate('classroom_policy')
        if path=='/groups':gate('group_policy')
        if path=='/dhikr':
            s=service.state(member);return {'goals':list(s['dhikrGoals'].values()),'counts':list(s['dhikrCounts'].values()),'readingCredit':0}
        if path=='/reminder-preference':return service.state(member)['preferences'] or {'enabled':False,'deliveryStatus':'not_implemented'}
        if path=='/events':return {'events':service.store.events(member),'visibility':'private'}
        match=re.fullmatch(r'/reading-sessions/([^/]+)/trace',path)
        if match:return service.trace(member,match[1])
        match=re.fullmatch(r'/reading-acts/([^/]+)',path)
        if match:
            act=service.state(member)['acts'].get(match[1])
            if not act:raise DomainError('NOT_FOUND','Reading act not found.',404)
            history=[e['payload'] for e in service.store.events(member) if e['entity_id']==match[1] and e['kind'].startswith('Reading')]
            return {'act':act,'revisions':history}
    if method=='POST' and path=='/offline-snapshot/verify':return service.verify_snapshot(member,body)
    ops={('POST','/reading-acts'):'reading',('POST','/commitment-changes'):'change',
         ('POST','/dhikr/goals'):'dhikr_goal',('POST','/dhikr/counts'):'dhikr_count',('PUT','/reminder-preference'):'reminder'}
    if (method,path) in ops:return service.mutate(member,ops[method,path],body)
    for verb,pattern,op in [('PATCH',r'/reading-acts/([^/]+)','correct'),('POST',r'/reading-acts/([^/]+)/retract','retract'),
                            ('PUT',r'/reading-sessions/([^/]+)/trace','trace'),('POST',r'/reading-sessions/([^/]+)/discard','discard_trace')]:
        match=re.fullmatch(pattern,path)
        if method==verb and match:return service.mutate(member,op,body,match[1])
    if method=='POST' and path in ('/groups/publications','/groups/consents','/groups/memberships'):gate('group_policy')
    if method=='POST' and path=='/pauses':gate('pause_travel')
    if method=='POST' and path=='/classroom/grade':gate('classroom_policy')
    raise DomainError('NOT_FOUND','Endpoint not found.',404)

def make_server(db_path,host='127.0.0.1',port=8765,signing_key=None,clock=None):
    if host not in ('127.0.0.1','localhost','::1'):raise ValueError('This local slice only binds loopback.')
    # Migrate once before request handling, rather than racing first requests.
    Store(db_path).close()
    class Handler(BaseHTTPRequestHandler):
        server_version='SafinaLocal/0.3'
        def log_message(self,*args):pass  # No request URLs, bearer tokens or reading telemetry.
        def respond(self,status,value):
            raw=json.dumps(value,ensure_ascii=False,allow_nan=False).encode()
            self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
        def run_request(self):
            self.connection.settimeout(10)
            store=None
            try:
                url=urlsplit(self.path);q=parse_qs(url.query)
                if len(self.path)>4096 or any(len(v)!=1 for v in q.values()):raise DomainError('INVALID_QUERY','Use one value per query parameter.')
                if self.command=='GET' and url.path=='/health':return self.respond(200,{'status':'ok','mode':'local','contractVersion':'0.3.0'})
                auth=self.headers.get('Authorization','')
                if not auth.startswith('Bearer '):raise DomainError('UNAUTHORIZED','A member bearer token is required.',401)
                store=Store(db_path);member=store.authenticate(auth[7:]);service=Service(store,now=clock,signing_key=signing_key)
                body={}
                if self.command in ('POST','PUT','PATCH'):
                    if self.headers.get('Transfer-Encoding'):raise DomainError('INVALID_BODY','Chunked request bodies are not supported.')
                    try:length=int(self.headers.get('Content-Length','0'))
                    except ValueError:raise DomainError('INVALID_BODY','Invalid Content-Length.')
                    if not 0<length<=MAX_BODY:raise DomainError('BODY_TOO_LARGE','Supply a JSON body up to 128 KiB.',413)
                    if self.headers.get_content_type()!='application/json':raise DomainError('UNSUPPORTED_MEDIA_TYPE','Use application/json.',415)
                    try:
                        def no_duplicates(pairs):
                            result={}
                            for k,v in pairs:
                                if k in result:raise ValueError('Duplicate JSON key')
                                result[k]=v
                            return result
                        body=json.loads(self.rfile.read(length),object_pairs_hook=no_duplicates,parse_constant=lambda x:(_ for _ in ()).throw(ValueError('Nonfinite JSON')))
                    except (ValueError,UnicodeDecodeError):raise DomainError('INVALID_JSON','Body must be valid unambiguous JSON.',400)
                if self.command=='GET':
                    with store.transaction():
                        result=dispatch(service,member,self.command,url.path,q,body)
                else:
                    result=dispatch(service,member,self.command,url.path,q,body)
                self.respond(200,result)
            except DomainError as e:self.respond(e.status,e.body())
            except (KeyError,TypeError,ValueError) as e:self.respond(422,{'error':{'code':'INVALID_REQUEST','message':'Request fields or values are invalid.'}})
            except Exception:
                self.respond(500,{'error':{'code':'INTERNAL_ERROR','message':'The local service could not complete this request.'}})
            finally:
                if store:store.close()
        do_GET=do_POST=do_PUT=do_PATCH=do_DELETE=run_request
    return ThreadingHTTPServer((host,port),Handler)
