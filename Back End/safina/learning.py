"""Published versioned content, member access, prerequisite enforcement and private work."""
import base64
import hashlib
import hmac
import json
from datetime import timedelta
from urllib.parse import urlsplit,quote
from .domain import DomainError,canonical,digest,instant
from .service import fields,text_field
from .media import youtube_source

class Learning:
    def __init__(self,service,config):self.s=service;self.db=service.store.db;self.config=config
    def course(self,id):
        row=self.db.execute('SELECT payload FROM content_courses WHERE id=? ORDER BY version DESC LIMIT 1',(id,)).fetchone()
        if not row:raise DomainError('CONTENT_NOT_AVAILABLE','هذا المحتوى غير متاح بعد.',404)
        c=json.loads(row['payload'])
        if not c.get('published'):raise DomainError('CONTENT_WITHDRAWN','المحتوى غير متاح حالياً.',404)
        if c.get('sandbox') and self.config.mode!='sandbox':raise DomainError('CONTENT_NOT_AVAILABLE','محتوى اختبار غير متاح هنا.',404)
        return c
    def access(self,member,c):
        account=self.s.account(member)
        if account['role']=='founder':return 'founder_preview'
        if c['free']:return 'free'
        e=self.db.execute('SELECT * FROM enrollments WHERE member_id=? AND course_id=?',(member,c['id'])).fetchone()
        if e and e['status']=='active' and (not e['expires_at'] or instant(e['expires_at'])>self.s.now()):return 'enrolled'
        raise DomainError('ENTITLEMENT_REQUIRED','هذه الدورة تحتاج تسجيلاً صالحاً.',403)
    def record(self,member,course,kind,id):
        row=self.db.execute('SELECT * FROM learning_records WHERE member_id=? AND course_id=? AND kind=? AND entity_id=?',(member,course,kind,id)).fetchone()
        return {**json.loads(row['payload']),'revision':row['revision']} if row else {'revision':0}
    def save(self,member,course,kind,id,payload,expected):
        old=self.record(member,course,kind,id)
        if type(expected) is not int or expected!=old['revision']:raise DomainError('REVISION_CONFLICT','تغيّر هذا السجل على جهاز آخر.',409,current=old)
        rev=expected+1
        self.db.execute('INSERT INTO learning_records VALUES(?,?,?,?,?,?) ON CONFLICT(member_id,course_id,kind,entity_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',(member,course,kind,id,rev,canonical(payload)))
        self.db.execute('INSERT INTO learning_history(member_id,course_id,kind,entity_id,revision,payload,created_at) VALUES(?,?,?,?,?,?,?)',(member,course,kind,id,rev,canonical(payload),self.s.timestamp()))
        return {**payload,'revision':rev}
    def module_complete(self,member,c,m):
        lessons=all(self.record(member,c['id'],'progress',l['id']).get('completed',False) and self.record(member,c['id'],'progress',l['id']).get('courseVersion')==c['version'] for l in m['lessons'] if l['required'])
        answers=self.record(member,c['id'],'answers',m['id'])
        submitted=answers.get('state')=='submitted' and answers.get('courseVersion')==c['version']
        return lessons and submitted
    def module(self,member,c,id):
        access=self.access(member,c)
        for i,m in enumerate(c['modules']):
            if m['id']==id:
                locked=not all(self.module_complete(member,c,prior) for prior in c['modules'][:i])
                if locked and access!='founder_preview':raise DomainError('MODULE_LOCKED','أكمل الدروس المطلوبة وإجابات الأسابيع السابقة أولاً.',403,moduleId=id)
                return m
        raise DomainError('NOT_FOUND','الوحدة غير موجودة.',404)
    def lesson(self,member,c,id):
        for m in c['modules']:
            for l in m['lessons']:
                if l['id']==id:self.module(member,c,m['id']);return m,l
        raise DomainError('NOT_FOUND','الدرس غير موجود.',404)
    def _version(self,body,c):
        if body['courseVersion']!=c['version']:raise DomainError('CONTENT_VERSION_CONFLICT','تغيّر إصدار المحتوى. راجع أحدث إصدار.',409,currentVersion=c['version'])
    def catalog(self,member,cursor=None,limit=20):
        result=[]
        rows=self.db.execute('SELECT c.payload FROM content_courses c JOIN (SELECT id,max(version) version FROM content_courses GROUP BY id) x ON c.id=x.id AND c.version=x.version')
        for row in rows:
            c=json.loads(row['payload'])
            if not c['published'] or (c.get('sandbox') and self.config.mode!='sandbox'):continue
            try:access=self.access(member,c)
            except DomainError:access='not_enrolled'
            modules=[self.module_complete(member,c,m) for m in c['modules']] if access!='not_enrolled' else [False]*len(c['modules'])
            resume=next((l['id'] for m in c['modules'] for l in m['lessons'] if not self.record(member,c['id'],'progress',l['id']).get('completed')),None) if access!='not_enrolled' else None
            result.append({k:c[k] for k in ('id','title','version','format','thumbnail','sandbox')}|{'thumbnail':self.thumbnail_link(c) if access!='not_enrolled' else None,'access':access,'completedModules':sum(modules),'moduleCount':len(modules),'complete':all(modules),'resumeLessonId':resume})
        page,nxt=self.paginate(member,'courses',result,cursor,limit)
        return {'items':page,'nextCursor':nxt,'contentState':'published' if result else 'awaiting_approved_content'}
    def detail(self,member,id):
        c=self.course(id);access=self.access(member,c);modules=[]
        for i,m in enumerate(c['modules']):
            unlocked=access=='founder_preview' or all(self.module_complete(member,c,p) for p in c['modules'][:i])
            modules.append({'id':m['id'],'title':m['title'],'accessible':unlocked,'complete':self.module_complete(member,c,m),
                            'lessons':[{k:l[k] for k in ('id','title','required','thumbnail','durationSeconds')}|{'thumbnail':self.thumbnail_link(c,l),'progress':self.record(member,id,'progress',l['id']) if unlocked else None} for l in m['lessons']],
                            'questions':m['questions'] if unlocked else [],'answers':self.record(member,id,'answers',m['id']) if unlocked else None})
        return {k:c[k] for k in ('id','title','version','format','thumbnail','sandbox')}|{'thumbnail':self.thumbnail_link(c),'modules':modules,'access':access,'complete':all(self.module_complete(member,c,m) for m in c['modules'])}
    def playback(self,member,course,lesson):
        if not lesson.get('video'):return {'status':'no_video_supplied','url':None,'expiresAt':None}
        if not lesson['video'].get('rightsReviewed'):raise DomainError('MEDIA_RIGHTS_NOT_APPROVED','حقوق هذا الفيديو بانتظار الاعتماد.',409)
        video=lesson['video']
        if video.get('kind')=='youtube':
            source=youtube_source(video)
            return {'status':'ready' if source['embeddable'] else 'embedding_unavailable','url':source['embedUrl'] if source['embeddable'] else None,'expiresAt':None,'kind':'youtube','source':{k:source[k] for k in ('videoId','url','sourceTitle','sourceAuthor','reviewedAt','embeddable')}}
        if video.get('processingState','ready')!='ready':return {'status':video['processingState'],'url':None,'expiresAt':None}
        expiry=(self.s.now()+timedelta(minutes=5)).isoformat();payload={'memberId':member,'courseId':course['id'],'version':course['version'],'lessonId':lesson['id'],'expiresAt':expiry}
        raw=base64.urlsafe_b64encode(canonical(payload).encode()).decode().rstrip('=');sig=hmac.new(self.config.key,raw.encode(),hashlib.sha256).hexdigest()
        return {'status':'ready','url':'/api/v1/media/playback?ticket='+raw+'.'+sig,'expiresAt':expiry}
    def media_url(self,member,ticket):
        try:
            raw,sig=ticket.split('.')
            if not hmac.compare_digest(sig,hmac.new(self.config.key,raw.encode(),hashlib.sha256).hexdigest()):raise ValueError()
            p=json.loads(base64.urlsafe_b64decode(raw+'='*(-len(raw)%4)))
            if p['memberId']!=member:raise ValueError()
        except (ValueError,KeyError,TypeError):raise DomainError('INVALID_MEDIA_TICKET','رابط الفيديو غير صالح.',403)
        if instant(p['expiresAt'])<=self.s.now():raise DomainError('MEDIA_URL_EXPIRED','انتهت صلاحية رابط الفيديو. أعد فتح الدرس.',410)
        c=self.course(p['courseId']);self._version({'courseVersion':p['version']},c);_,l=self.lesson(member,c,p['lessonId'])
        if not l['video']['rightsReviewed']:raise DomainError('MEDIA_RIGHTS_NOT_APPROVED','حقوق الفيديو غير معتمدة.',409)
        return self.asset_url({k:l['video'][k] for k in ('storageBucket','storagePath','rightsReviewed')})
    def lesson_detail(self,member,id,lid):
        c=self.course(id);m,l=self.lesson(member,c,lid)
        return {k:l[k] for k in ('id','title','required','thumbnail','durationSeconds')}|{'thumbnail':self.thumbnail_link(c,l),'resources':[{'id':r['id'],'title':r['title'],'url':f'/api/v1/learning/courses/{id}/lessons/{lid}/resources/'+r['id']} for r in l['resources']]}|{'moduleId':m['id'],'courseId':id,'courseVersion':c['version'],
                'captions':[{'id':x['id'],'language':x['language'],'label':x['label'],'url':f'/api/v1/learning/courses/{id}/lessons/{lid}/captions/'+x['id']} for x in l.get('captions',[])],'playback':self.playback(member,c,l),'progress':self.record(member,id,'progress',lid),'note':self.record(member,id,'note',lid),
                'bookmark':self.record(member,id,'bookmark',lid),'completionPolicy':l['completionPolicy'],'sandbox':c['sandbox']}
    def write_lesson(self,member,id,lid,kind,body):
        required=['mutationId','expectedRevision','courseVersion']
        extras={'progress':['positionSeconds','completed'],'note':['body'],'bookmark':['saved']}
        fields(body,required+extras[kind]);c=self.course(id);self._version(body,c);_,l=self.lesson(member,c,lid)
        if kind=='progress':
            if type(body['positionSeconds']) not in (int,float) or not math_isfinite(body['positionSeconds']) or not 0<=body['positionSeconds']<=l['durationSeconds']:raise DomainError('INVALID_PROGRESS','موضع التشغيل غير صالح.')
            if type(body['completed']) is not bool:raise DomainError('INVALID_COMPLETION','إتمام الدرس يحتاج تأكيداً واضحاً.')
            if body['completed'] and (l['completionPolicy']!='member_confirmation' or not l['completionPolicyApproved']):raise DomainError('WATCH_POLICY_NOT_APPROVED','سياسة إتمام هذا الدرس بانتظار الاعتماد.',409)
        elif kind=='note':
            if not isinstance(body['body'],str) or len(body['body'])>20000:raise DomainError('INVALID_NOTE','الملاحظة أطول من الحد المسموح.')
        elif type(body['saved']) is not bool:raise DomainError('INVALID_BOOKMARK','قيمة الحفظ غير صالحة.')
        payload={k:body[k] for k in ['courseVersion']+extras[kind]};record=self.save(member,id,kind,lid,payload,body['expectedRevision'])
        return {'record':record,'course':self.detail(member,id),'readingCredit':0}
    def answers(self,member,id,mid,body,submit=False):
        fields(body,['mutationId','expectedRevision','courseVersion','answers']);c=self.course(id);self._version(body,c);m=self.module(member,c,mid)
        if not isinstance(body['answers'],dict) or set(body['answers'])-{q['id'] for q in m['questions']}:raise DomainError('INVALID_ANSWERS','راجع معرّفات الأسئلة.')
        if any(not isinstance(x,str) or len(x)>20000 for x in body['answers'].values()):raise DomainError('INVALID_ANSWERS','الإجابات يجب أن تكون نصوصاً ضمن الحد المسموح.')
        if submit:
            if not all(self.record(member,id,'progress',l['id']).get('completed',False) and self.record(member,id,'progress',l['id']).get('courseVersion')==c['version'] for l in m['lessons'] if l['required']):raise DomainError('LESSONS_REQUIRED','أكمل الدروس المطلوبة قبل إرسال الإجابات.',409)
            missing=[q['id'] for q in m['questions'] if q['required'] and not body['answers'].get(q['id'],'').strip()]
            if missing:raise DomainError('ANSWERS_REQUIRED','أجب عن الأسئلة المطلوبة.',422,questionIds=missing)
        payload={'answers':body['answers'],'state':'submitted' if submit else 'draft','courseVersion':c['version'],'submittedAt':self.s.timestamp() if submit else None,'grading':'not_graded'}
        record=self.save(member,id,'answers',mid,payload,body['expectedRevision'])
        return {'record':record,'course':self.detail(member,id),'readingCredit':0}
    def library(self,member,query='',cursor=None,limit=20):
        if not isinstance(query,str) or len(query)>200:raise DomainError('INVALID_SEARCH','عبارة البحث طويلة جداً.')
        terms=normalize(query).split();result=[]
        rows=self.db.execute('SELECT l.payload FROM content_library l JOIN (SELECT id,max(version) version FROM content_library GROUP BY id) x ON l.id=x.id AND l.version=x.version')
        for row in rows:
            item=json.loads(row['payload'])
            if not item['published'] or not item['rightsReviewed'] or not item['editorialReviewed'] or (item.get('sandbox') and self.config.mode!='sandbox'):continue
            if item.get('courseId'):
                try:self.access(member,self.course(item['courseId']))
                except DomainError:continue
            hay=normalize(' '.join([item['title'],*item['tags'],item.get('transcript','')]))
            if all(t in hay for t in terms):result.append(item)
        page,nxt=self.paginate(member,'library:'+normalize(query),sorted(result,key=lambda x:(x['title'],x['id'])),cursor,limit)
        return {'items':page,'nextCursor':nxt,'contentState':'published' if result else 'no_matching_reviewed_content'}
    def paginate(self,member,scope,items,cursor,limit):
        from .community import Community
        rows=[{'id':x['id'],'revision':digest(x),'item':x} for x in items]
        page,nxt,_,_=Community(self.s).paginate(member,'learning:'+scope,rows,cursor,limit)
        return [x['item'] for x in page],nxt
    def publish_course(self,c):
        # Local staff command only; never exposed as a member/founder-client override.
        fields(c,['id','version','title','format','thumbnail','free','sandbox','published','rightsReviewed','editorialReviewed','modules'])
        if c['format'] not in ('weekly','single_class') or type(c['version']) is not int or c['version']<1:raise DomainError('INVALID_COURSE','Invalid course format/version.')
        if not c['modules'] or len(c['modules'])>52 or (c['format']=='single_class' and len(c['modules'])!=1):raise DomainError('INVALID_COURSE','Invalid module structure.')
        if c['published'] and not (c['rightsReviewed'] and c['editorialReviewed']):raise DomainError('CONTENT_NOT_APPROVED','Publication requires rights and editorial review.',409)
        if c['sandbox'] and self.config.mode!='sandbox':raise DomainError('SANDBOX_CONTENT_REJECTED','Sandbox courses cannot be published in the live configuration.',409)
        for key in ('free','sandbox','published','rightsReviewed','editorialReviewed'):
            if type(c[key]) is not bool:raise DomainError('INVALID_COURSE','Flags must be boolean.')
        self.validate_thumbnail(c['thumbnail'])
        ids=set()
        for m in c['modules']:
            fields(m,['id','title','lessons','questions'])
            if m['id'] in ids or not m['lessons']:raise DomainError('INVALID_COURSE','Duplicate module or no lessons.')
            ids.add(m['id'])
            for l in m['lessons']:
                fields(l,['id','title','required','thumbnail','durationSeconds','video','resources','completionPolicy','completionPolicyApproved'],['captions'])
                if l['id'] in ids or type(l['durationSeconds']) not in (int,float) or not math_isfinite(l['durationSeconds']) or l['durationSeconds']<0:raise DomainError('INVALID_LESSON','Duplicate lesson or invalid duration.')
                ids.add(l['id']);self.validate_thumbnail(l['thumbnail'])
                if type(l['required']) is not bool or type(l['completionPolicyApproved']) is not bool or l['completionPolicy'] not in ('awaiting_approval','member_confirmation'):raise DomainError('INVALID_LESSON','Invalid completion policy.')
                for resource in l['resources']:
                    fields(resource,['id','title','asset']);self.validate_asset(resource['asset'])
                for caption in l.get('captions',[]):
                    fields(caption,['id','language','label','asset']);text_field(caption['id'],100);text_field(caption['language'],20);text_field(caption['label'],100);self.validate_asset(caption['asset'])
                if l['video']:self.validate_video(l['video'],c['published'])
            qids=set()
            for q in m['questions']:
                fields(q,['id','prompt','required'])
                if q['id'] in qids:raise DomainError('INVALID_QUESTION','Duplicate question ID.')
                qids.add(q['id'])
        prior=self.db.execute('SELECT max(version) FROM content_courses WHERE id=?',(c['id'],)).fetchone()[0] or 0
        if c['version']!=prior+1:raise DomainError('CONTENT_VERSION_CONFLICT','Content versions are sequential and immutable.',409)
        self.db.execute('INSERT INTO content_courses VALUES(?,?,?,?)',(c['id'],c['version'],canonical(c),int(c['published'])))
        return {'id':c['id'],'version':c['version'],'published':c['published']}

    def validate_thumbnail(self,value):
        if value is None:return
        if isinstance(value,dict):return self.validate_asset(value)
        if not isinstance(value,str) or urlsplit(value).scheme!='https':raise DomainError('INVALID_THUMBNAIL','Use reviewed HTTPS thumbnails or private storage assets.')
    def thumbnail_link(self,course,lesson=None):
        asset=(lesson or course)['thumbnail']
        if not isinstance(asset,dict):return asset
        return '/api/v1/learning/courses/'+course['id']+('/lessons/'+lesson['id'] if lesson else '')+'/thumbnail'
    def thumbnail_url(self,member,id,lid=None):
        c=self.course(id);self.access(member,c)
        asset=self.lesson(member,c,lid)[1]['thumbnail'] if lid else c['thumbnail']
        if not isinstance(asset,dict):raise DomainError('NOT_FOUND','الصورة غير متاحة.',404)
        return self.asset_url(asset)

    def validate_video(self,video,published):
        if video.get('kind')=='youtube':return youtube_source(video)
        if video.get('kind')=='upload':
            fields(video,['kind','storageBucket','storagePath','rightsReviewed','processingState','mimeType','sizeBytes','sha256','durationSeconds'])
            import re
            if video['processingState'] not in ('processing','ready','failed') or video['mimeType']!='video/mp4' or type(video['sizeBytes']) is not int or not 0<video['sizeBytes']<=2*1024**3 or not re.fullmatch(r'[0-9a-f]{64}',video['sha256']) or type(video['durationSeconds']) not in (int,float) or not 0<video['durationSeconds']<=14400:raise DomainError('INVALID_MEDIA','Invalid prepared upload metadata.')
            if published and video['processingState']!='ready':raise DomainError('MEDIA_NOT_READY','Finish media processing before publication.',409)
            return self.validate_asset({k:video[k] for k in ('storageBucket','storagePath','rightsReviewed')})
        return self.validate_asset(video) # Existing v0.4 private storage references remain compatible.
    def caption_url(self,member,id,lid,cid):
        c=self.course(id);_,l=self.lesson(member,c,lid)
        caption=next((x for x in l.get('captions',[]) if x['id']==cid),None)
        if not caption:raise DomainError('NOT_FOUND','الترجمة غير متاحة.',404)
        return self.asset_url(caption['asset'])

    def validate_asset(self,asset):
        fields(asset,['storageBucket','storagePath','rightsReviewed'])
        text_field(asset['storageBucket'],100);text_field(asset['storagePath'],1000)
        if type(asset['rightsReviewed']) is not bool or not asset['rightsReviewed']:raise DomainError('MEDIA_RIGHTS_NOT_APPROVED','حقوق المادة بانتظار الاعتماد.',409)
        if '/' in asset['storageBucket'] or any(p in ('','..','.') for p in asset['storagePath'].split('/')):raise DomainError('INVALID_MEDIA_PATH','Invalid storage path.')
    def asset_url(self,asset):
        self.validate_asset(asset)
        if not self.config.storage_key or not self.config.supabase_url:raise DomainError('MEDIA_DELIVERY_NOT_CONFIGURED','تشغيل المواد يحتاج إعداد التخزين الخاص.',503)
        from urllib.request import Request,urlopen
        from urllib.error import HTTPError,URLError
        path='/object/sign/'+quote(asset['storageBucket'],safe='')+'/'+quote(asset['storagePath'],safe='/')
        req=Request(self.config.supabase_url.rstrip('/')+'/storage/v1'+path,data=b'{"expiresIn":60}',headers={'Authorization':'Bearer '+self.config.storage_key,'apikey':self.config.storage_key,'Content-Type':'application/json'},method='POST')
        try:
            with urlopen(req,timeout=15) as response:value=json.loads(response.read(32768))
            signed=value['signedURL']
            if not signed.startswith('/object/sign/'):raise ValueError()
            return self.config.supabase_url.rstrip('/')+'/storage/v1'+signed
        except (HTTPError,URLError,ValueError,KeyError,TimeoutError):raise DomainError('MEDIA_UNAVAILABLE','تعذّر تحميل المادة حالياً.',503)
    def resource_url(self,member,id,lid,rid):
        c=self.course(id);_,l=self.lesson(member,c,lid)
        resource=next((r for r in l['resources'] if r['id']==rid),None)
        if not resource:raise DomainError('NOT_FOUND','المادة غير متاحة.',404)
        return self.asset_url(resource['asset'])
    def publish_library(self,item):
        fields(item,['id','version','title','tags','transcript','url','published','rightsReviewed','editorialReviewed','sandbox'],['courseId'])
        for key in ('id','title'):text_field(item[key],200)
        if type(item['version']) is not int or item['version']<1 or not isinstance(item['tags'],list) or not isinstance(item['transcript'],str):raise DomainError('INVALID_CONTENT','Invalid library content.')
        if item['url'] and urlsplit(item['url']).scheme!='https':raise DomainError('INVALID_MEDIA_URL','Public source links must use HTTPS.')
        if any(type(item[k]) is not bool for k in ('published','rightsReviewed','editorialReviewed','sandbox')):raise DomainError('INVALID_CONTENT','Flags must be boolean.')
        if item['published'] and not (item['rightsReviewed'] and item['editorialReviewed']):raise DomainError('CONTENT_NOT_APPROVED','Review rights and content before publication.',409)
        if item['sandbox'] and self.config.mode!='sandbox':raise DomainError('SANDBOX_CONTENT_REJECTED','Sandbox content cannot be published live.',409)
        if item.get('courseId'):self.course(item['courseId'])
        prior=self.db.execute('SELECT max(version) FROM content_library WHERE id=?',(item['id'],)).fetchone()[0] or 0
        if item['version']!=prior+1:raise DomainError('CONTENT_VERSION_CONFLICT','Use the next immutable content version.',409)
        self.db.execute('INSERT INTO content_library VALUES(?,?,?,?)',(item['id'],item['version'],canonical(item),int(item['published'])))
        return {'id':item['id'],'version':item['version'],'published':item['published']}

def math_isfinite(n):
    import math
    return math.isfinite(n)
def normalize(value):
    import re,unicodedata
    value=''.join(ch for ch in unicodedata.normalize('NFKD',value.casefold()) if not unicodedata.combining(ch))
    return re.sub('[أإآ]','ا',value).replace('ى','ي').replace('ـ','')
