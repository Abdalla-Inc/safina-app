"""Account-backed services and current product policy, preserving the v0.3 ledger."""
import base64
import io
import json
import math
from datetime import timedelta
from uuid import uuid4,uuid5,NAMESPACE_URL
from .domain import (REF,ROOT,RULE_VERSION,DomainError,canonical,civil,coverage_of,digest,instant,zone,TIERS)
from .policy_v2 import RULE,MECCA,assigned,mecca_day,registry,week,week_status
from .service import Service,act_day,fields,text_field,uuid
from .community import Community
from .activity import Activity, country_code

from .launch import Launch
from . import custom_plans

class ConnectedService(Launch,Activity,Service):
    def _make_assignment(self,member,day,c,tz):
        if c.get('ruleVersion')==custom_plans.RULE:return custom_plans.assigned(member,day,c)
        return assigned(day,c['tier'],c['id'],member,tz) if c.get('ruleVersion')==RULE else super()._make_assignment(member,day,c,tz)
    def _versions(self,body):
        if body['ruleVersion'] not in (RULE,RULE_VERSION,custom_plans.RULE) or body['referenceVersion']!=REF.version:raise DomainError('INCOMPATIBLE_SNAPSHOT','إصدار الورد تغيّر. راجع الإدخال المحفوظ قبل إعادة إرساله.',409)
    def _validate_occurrence_snapshot(self,body,snap,at):
        if snap['ruleVersion'] not in (RULE,custom_plans.RULE):return super()._validate_occurrence_snapshot(body,snap,at)
        if body.get('assignmentDay')!=snap['date'] or mecca_day(at)!=snap['date']:raise DomainError('ASSIGNMENT_DAY_MISMATCH','يجب أن يطابق وقت القراءة يوم الورد بتوقيت مكة.',409,assignmentDay=snap['date'],communityDay=mecca_day(at))
    def _is_travel(self,member,a):
        return False if a['ruleVersion'] in (RULE,custom_plans.RULE) else super()._is_travel(member,a)
    def _exclude_from_khatma(self,a,c):
        if a['ruleVersion'] in (RULE,custom_plans.RULE) and civil(act_day(a)).weekday()==5 and civil(act_day(a)).day!=31:return False
        return super()._exclude_from_khatma(a,c)
    def _materialize(self,member):
        super()._materialize(member)
        Community(self).rebuild(member)
        self.ship_visual(member)
    def current_rules(self,member):
        c=self._commitment_at(self.state(member),self.now())
        if c.get('ruleVersion')==custom_plans.RULE:return custom_plans.registry()
        return registry() if c.get('ruleVersion')==RULE else json.loads((ROOT/'data/program_rules.json').read_text())
    def today(self,member,day=None):
        result=super().today(member,day);actual=REF.coverage(result['evaluation']['uniqueCoverage'])
        result['componentStates']=[{'id':c['id'],'label':c['label'],'ranges':c['ranges'],
                                  'status':'completed' if REF.coverage(c['ranges'])<=actual else ('partial' if REF.coverage(c['ranges'])&actual else 'no_entry'),
                                  'coveredRanges':REF.ranges(REF.coverage(c['ranges'])&actual),
                                  'coveredVerseCount':len(REF.coverage(c['ranges'])&actual),'targetVerseCount':len(REF.coverage(c['ranges']))}
                                 for c in result['assignment']['components']]
        result.update(serverTime=self.timestamp(),assignmentDay=result['assignment']['date'],communityDay=mecca_day(self.now()),projectionRevision=Community(self).cursor())
        result.update(istighfar=self.istighfar(member,result['assignmentDay']),customReadings=self.custom_groups(member,result['assignmentDay']))
        if result['assignment']['tier']=='CUSTOM':result['customWird']=self.custom_wird_today(member,result['assignment'])
        return result
    def context(self):
        day=mecca_day(self.now());w=week(day);tomorrow=civil(day)+timedelta(days=1)
        return {'serverTime':self.timestamp(),'day':day,**w,'status':week_status(day,self.now()),'communityId':'safina-app',
                'nextDayRollover':instant(tomorrow.isoformat()+'T00:00:00+03:00').isoformat(),'nextWeekRollover':w['endExclusive'],
                'restDay':civil(day).weekday()==5,'restDayPolicy':{'version':RULE,'appliesTo':list(TIERS)},
                'ayah':{'status':'awaiting_asset_approval','references':['53:39','76:22'],'text':None,'textVersion':None},
                'projectionRevision':Community(self).cursor()}
    def account(self,member):
        r=self.store.db.execute('SELECT * FROM accounts WHERE member_id=?',(member,)).fetchone()
        if not r or r['status']!='active':raise DomainError('ACCOUNT_UNAVAILABLE','هذا الحساب غير متاح.',403)
        return dict(r)
    def commitment(self,member):
        state=self.state(member);cs=state['commitments'];current=self._commitment_at(state,self.now())
        history=[{**c,'effectiveTo':cs[i+1]['effectiveAt'] if i+1<len(cs) else None,'status':'pending' if instant(c['effectiveAt'])>self.now() else ('effective' if c['id']==current['id'] else 'historical'),'colorToken':'level.'+c['tier']} for i,c in enumerate(cs)]
        return {'effective':current,'pending':[c for c in history if c['status']=='pending'],'history':history,'availableTiers':list(TIERS)+['CUSTOM'],
                'allowedTransitions':{'nonweekly':'same_day','weekly':'next_sunday','crossCadence':'awaiting_policy'}}
    def me(self,member):
        a=self.account(member);p=json.loads(a['profile'])
        return {'id':member,**p,'countryCode':p.get('countryCode'),'istighfarGoal':p.get('istighfarGoal'),'setupStatus':'complete' if p.get('countryCode') and p.get('istighfarGoal') else 'required','capabilities':self.capabilities(),'avatarUrl':'/api/v1/assets/avatar/'+p['avatarId'] if p['avatarId'] else None,
                'revision':a['revision'],'status':a['status'],'timezone':MECCA,'email':a['email'],
                'permissions':{'superAdmin':a['role']=='founder','shipPreview':a['role']=='founder','founder':a['role']=='founder','moderate':a['role'] in ('founder','moderator')},
                'commitment':self.commitment(member),'featureFlags':{'automaticCommunity':True,'learning':True,'readerPassiveCredit':False},
                'communityScope':{'version':RULE,'description':'تظهر قراءاتك المؤكّدة واستغفارك المسجّل لأعضاء المجتمع تلقائياً. يظهر بلدك المختار بجانب اسمك. يمكنك إخفاء المشاركة من الإعدادات.'}}
    def atomic(self,member,operation,body,action):
        if not isinstance(body,dict) or 'mutationId' not in body:raise DomainError('MUTATION_ID_REQUIRED','كل تعديل يحتاج معرّفاً ثابتاً.')
        mutation=uuid(body['mutationId']);fingerprint=digest([operation,body])
        with self.store.transaction():
            self.account(member)
            row=self.store.db.execute('SELECT * FROM mutations WHERE member_id=? AND mutation_id=?',(member,mutation)).fetchone()
            if row:
                if row['request_hash']!=fingerprint:raise DomainError('IDEMPOTENCY_CONFLICT','استُخدم المعرّف نفسه لطلب مختلف.',409)
                return json.loads(row['response'])
            result=action()
            self.store.db.execute('INSERT INTO mutations VALUES(?,?,?,?)',(member,mutation,fingerprint,canonical(result)))
            return result
    def profile_update(self,member,body):
        fields(body,['mutationId','expectedRevision'],['displayName','locale','largeText','reducedMotion','communityVisible','countryCode'])
        a=self.account(member)
        if type(body['expectedRevision']) is not int or body['expectedRevision']!=a['revision']:raise DomainError('REVISION_CONFLICT','تغيّر الملف الشخصي. حدّث الصفحة.',409,currentRevision=a['revision'])
        p=json.loads(a['profile'])
        if 'countryCode' in body:p['countryCode']=country_code(body['countryCode'])
        if 'displayName' in body:p['displayName']=text_field(body['displayName'],80).strip()
        if 'locale' in body:
            if body['locale'] not in ('ar','en'):raise DomainError('INVALID_LOCALE','اختر العربية أو الإنجليزية.')
            p['locale']=body['locale']
        for name in ('largeText','reducedMotion','communityVisible'):
            if name in body:
                if type(body[name]) is not bool:raise DomainError('INVALID_PREFERENCE','قيمة الإعداد غير صالحة.')
                p[name]=body[name]
        self.store.db.execute('UPDATE accounts SET profile=?,revision=revision+1 WHERE member_id=?',(canonical(p),member))
        c=Community(self);c.rebuild(member);c.profile_changed(member,a['revision']+1)
        return self.me(member)
    def avatar(self,member,body,remove=False):
        fields(body,['mutationId','expectedRevision']+([] if remove else ['dataBase64']))
        a=self.account(member)
        if type(body['expectedRevision']) is not int or body['expectedRevision']!=a['revision']:raise DomainError('REVISION_CONFLICT','تغيّرت الصورة أو البيانات.',409,currentRevision=a['revision'])
        p=json.loads(a['profile']);asset=None
        if not remove:
            from PIL import Image,ImageOps,UnidentifiedImageError
            try:
                if not isinstance(body['dataBase64'],str) or len(body['dataBase64'])>14000000:raise ValueError()
                raw=base64.b64decode(body['dataBase64'],validate=True)
                if len(raw)>10*1024*1024:raise ValueError()
                check=Image.open(io.BytesIO(raw))
                if check.format not in ('JPEG','PNG','WEBP') or check.width*check.height>20000000:raise ValueError()
                check.verify();im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw)));im.thumbnail((256,256))
                if im.mode in ('RGBA','LA'):
                    bg=Image.new('RGB',im.size,'white');bg.paste(im,mask=im.getchannel('A'));im=bg
                else:im=im.convert('RGB')
                # Fresh raster strips metadata, active content and trailing bytes.
                clean=Image.new('RGB',im.size,'white');clean.paste(im);out=io.BytesIO();clean.save(out,format='JPEG',quality=85)
            except (ValueError,OSError,Image.DecompressionBombError,UnidentifiedImageError):raise DomainError('INVALID_AVATAR','اختر صورة JPEG أو PNG أو WebP صالحة، حتى ١٠ ميغابايت.')
            asset=str(uuid4());self.store.db.execute('INSERT INTO avatar_assets VALUES(?,?,?,?,?,1)',(asset,member,'image/jpeg',out.getvalue(),self.timestamp()))
        self.store.db.execute('DELETE FROM avatar_assets WHERE member_id=? AND id!=?',(member,asset or ''))
        p['avatarId']=asset;p['avatarVersion']+=1
        self.store.db.execute('UPDATE accounts SET profile=?,revision=revision+1 WHERE member_id=?',(canonical(p),member))
        Community(self).profile_changed(member,a['revision']+1)
        return self.me(member)
    def avatar_bytes(self,viewer,id):
        row=self.store.db.execute('SELECT * FROM avatar_assets WHERE id=? AND active=1',(id,)).fetchone()
        if not row:raise DomainError('NOT_FOUND','الصورة غير متاحة.',404)
        p=Community(self).profile(row['member_id'])
        if not p or (row['member_id']!=viewer and not p['communityVisible']):raise DomainError('NOT_FOUND','الصورة غير متاحة.',404)
        return row['mime'],row['data']
    def reader_get(self,member):
        r=self.store.db.execute('SELECT * FROM reader_preferences WHERE member_id=?',(member,)).fetchone()
        return {**json.loads(r['payload']),'revision':r['revision']} if r else {'edition':'hafs-madani-604','mapVersion':'tanzil-pages-1.0','page':1,'bookmarks':[],'revision':0}
    def reader_put(self,member,body):
        fields(body,['mutationId','expectedRevision','edition','mapVersion','page','bookmarks'])
        old=self.reader_get(member)
        if type(body['expectedRevision']) is not int or body['expectedRevision']!=old['revision']:raise DomainError('REVISION_CONFLICT','تغيّر موضع القراءة على جهاز آخر.',409,current=old)
        if body['edition']!='hafs-madani-604' or body['mapVersion']!='tanzil-pages-1.0':raise DomainError('PAGE_MAP_NOT_AVAILABLE','هذه الطبعة غير مدعومة.',409)
        pages=[body['page']]+body['bookmarks'] if isinstance(body['bookmarks'],list) else []
        if not pages or len(pages)>605 or any(type(n) is not int or not 1<=n<=604 for n in pages):raise DomainError('INVALID_PAGE','اختر صفحة من ١ إلى ٦٠٤.')
        p={k:body[k] for k in ('edition','mapVersion','page','bookmarks')};p['bookmarks']=sorted(set(p['bookmarks']));rev=old['revision']+1
        self.store.db.execute('INSERT INTO reader_preferences VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision',(member,canonical(p),rev))
        return {**p,'revision':rev}
    def component(self,member,id,body):
        fields(body,['mutationId','assignmentId','expectedInputHash','completed'],['occurredAt','occurrenceDate','timezone','utcOffsetMinutes'])
        if type(body['completed']) is not bool:raise DomainError('INVALID_COMPLETION','completed must be boolean.')
        snap=self._snapshot(member,body['assignmentId']);state=self.state(member);before=self.day(member,snap['date'],state)
        if before['inputHash']!=body['expectedInputHash']:raise DomainError('REVISION_CONFLICT','تغيّرت قراءات اليوم. راجع الحالة الحالية.',409,currentEvaluation=before)
        c=next((c for c in snap['components'] if c['id']==id),None)
        if not c:raise DomainError('COMPONENT_NOT_ASSIGNED','هذا الجزء غير مطلوب في الورد المحدد.',409)
        target=REF.coverage(c['ranges']);active=self._active(state,snap['date']);covered=coverage_of(active)
        if body['completed']:
            if not target<=covered:
                for k in ('occurredAt','occurrenceDate','timezone','utcOffsetMinutes'):
                    if k not in body:raise DomainError('INVALID_FIELDS','بيانات وقت القراءة مطلوبة.')
                request={k:body[k] for k in ('mutationId','occurredAt','occurrenceDate','timezone','utcOffsetMinutes')}
                request.update(logicalActId=str(uuid5(NAMESPACE_URL,member+body['mutationId']+id)),assignmentId=snap['id'],assignmentDay=snap['date'],
                               ruleVersion=snap['ruleVersion'],referenceVersion=snap['referenceVersion'],ranges=c['ranges'],source='component_self_report',componentId=id)
                self._record_reading(member,request,state)
        else:
            # First undo the deliberate whole-row report; retain earlier partials where possible.
            explicit=[a for a in active if a.get('componentId')==id and a['source']=='component_self_report']
            for a in explicit:self._correct(member,a['id'],{'mutationId':body['mutationId'],'expectedRevision':a['revision'],'reason':'Member reopened the assigned component'},state,True)
            state=self.state(member);active=self._active(state,snap['date'])
            if target<=coverage_of(active):
                for a in active:
                    ranges=REF.coverage(a['ranges']);remaining=ranges-target
                    if remaining==ranges:continue
                    correction={'mutationId':body['mutationId'],'expectedRevision':a['revision'],'reason':'Member reopened a component completed by combined reports'}
                    if remaining:correction.update(ranges=REF.ranges(remaining),ruleVersion=a['ruleVersion'],referenceVersion=a['referenceVersion'])
                    self._correct(member,a['id'],correction,state,not remaining)
        self._materialize(member)
        return {'today':self.today(member,snap['date']),'shipProgress':self.ship(member),'projectionRevision':Community(self).cursor()}
    def partial(self,member,body):
        fields(body,['mutationId','assignmentId','expectedInputHash','ranges','occurredAt','occurrenceDate','timezone','utcOffsetMinutes'])
        snap=self._snapshot(member,body['assignmentId']);state=self.state(member);before=self.day(member,snap['date'],state)
        if body['expectedInputHash']!=before['inputHash']:raise DomainError('REVISION_CONFLICT','تغيّرت قراءات اليوم.',409,currentEvaluation=before)
        ranges=REF.coverage(body['ranges']);target=REF.coverage(snap.get('eligibleRanges',snap['ranges']))
        if not ranges or not ranges<=target:raise DomainError('OUTSIDE_ASSIGNMENT','أدخل نطاقاً من ورد اليوم المعتمد فقط.')
        new=ranges-coverage_of(self._active(state,snap['date']))
        if new:
            request={k:body[k] for k in ('mutationId','assignmentId','occurredAt','occurrenceDate','timezone','utcOffsetMinutes')}
            request.update(logicalActId=str(uuid5(NAMESPACE_URL,member+body['mutationId'])),assignmentDay=snap['date'],ranges=REF.ranges(new),source='manual_physical',ruleVersion=snap['ruleVersion'],referenceVersion=snap['referenceVersion'])
            self._record_reading(member,request,state);self._materialize(member)
        return {'today':self.today(member,snap['date']),'unchanged':not bool(new),'projectionRevision':Community(self).cursor()}
    def export(self,member):
        self.account(member)
        learning=[dict(r,payload=json.loads(r['payload'])) for r in self.store.db.execute('SELECT * FROM learning_records WHERE member_id=?',(member,))]
        return {'schemaVersion':'0.5.0','exportedAt':self.timestamp(),'profile':self.me(member),'events':self.store.events(member),
                'reading':self.replay(member),'learningHistory':[dict(r,payload=json.loads(r['payload'])) for r in self.store.db.execute('SELECT * FROM learning_history WHERE member_id=? ORDER BY sequence',(member,))],'enrollments':[dict(r) for r in self.store.db.execute('SELECT * FROM enrollments WHERE member_id=?',(member,))],'reports':[dict(r) for r in self.store.db.execute('SELECT * FROM community_reports WHERE reporter_id=?',(member,))],'reader':self.reader_get(member),'learning':learning,'reactions':[dict(r) for r in self.store.db.execute('SELECT * FROM reactions WHERE member_id=?',(member,))]}
    def request_deletion(self,member,body):
        fields(body,['mutationId','confirmation'])
        if body['confirmation']!='DELETE':raise DomainError('CONFIRMATION_REQUIRED','اكتب DELETE لتأكيد طلب الحذف.')
        a=self.account(member);p=json.loads(a['profile']);p['communityVisible']=False;p['displayName']='حساب محذوف';p['avatarId']=None
        self.store.db.execute('UPDATE accounts SET status=?,profile=?,revision=revision+1 WHERE member_id=?',('deletion_requested',canonical(p),member))
        self.store.db.execute('DELETE FROM avatar_assets WHERE member_id=?',(member,))
        targets=[r['target_id'] for r in self.store.db.execute('SELECT target_id FROM reactions WHERE member_id=?',(member,))]
        self.store.db.execute('DELETE FROM reactions WHERE member_id=?',(member,));self.store.db.execute('UPDATE sessions SET revoked=1 WHERE member_id=?',(member,))
        c=Community(self);c.rebuild(member)
        for target in targets:c.emit(member,'reaction',target,a['revision']+1,{})
        id=str(uuid4());self.store.db.execute('INSERT INTO lifecycle_requests VALUES(?,?,?,?,?)',(id,member,'deletion','pending_retention_review',self.timestamp()))
        return {'id':id,'status':'deletion_requested','publicData':'withdrawn','sessions':'revoked','physicalErasure':'pending_retention_review','message':'أُخفيت المشاركة والصورة وأُغلقت الجلسات. طلب محو السجل قيد المراجعة.'}
