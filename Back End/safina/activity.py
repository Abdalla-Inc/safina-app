"""October activity contract: canonical custom evidence and independent daily istighfar."""
import json
from uuid import uuid5,NAMESPACE_URL
from .domain import REF,ROOT,DomainError,canonical,civil,instant,occurrence,zone
from .policy_v2 import RULE,mecca_day
from .service import fields,act_day,text_field

COUNTRIES=frozenset(json.loads((ROOT/'data/countries.json').read_text()))
PALETTE=['❤️','👏','🤲','👍','🔥']
def country_code(value):
    if not isinstance(value,str) or value.upper() not in COUNTRIES:raise DomainError('INVALID_COUNTRY','اختر بلدك من القائمة.')
    return value.upper()
def bounded_count(value,minimum=0):
    if type(value) is not int or not minimum<=value<=1000000:raise DomainError('INVALID_COUNT','أدخل عدداً صحيحاً ضمن الحدود المسموحة.',minimum=minimum,maximum=1000000)
    return value

def split_ranges(covered):
    """Canonical disjoint intervals that never merge across a surah boundary."""
    out=[]
    for r in REF.ranges(covered):
        start,first=map(int,r['start'].split(':'));end,last=map(int,r['end'].split(':'))
        for s in range(start,end+1):out.append({'start':f'{s}:{first if s==start else 1}','end':f'{s}:{last if s==end else REF.data["verseCounts"][s-1]}'})
    return out

def selection_ranges(selection):
    if not isinstance(selection,dict):raise DomainError('INVALID_SELECTION','اختر سورة أو أجزاء.')
    if selection.get('kind')=='juz':
        fields(selection,['kind','from','to'])
        a,b=selection['from'],selection['to']
        if type(a) is not int or type(b) is not int or not 1<=a<=b<=30:raise DomainError('INVALID_SELECTION','اختر أجزاء من ١ إلى ٣٠.')
        return split_ranges(frozenset().union(*(REF.juz(j) for j in range(a,b+1))))
    if selection.get('kind')=='surah':
        fields(selection,['kind','surahId','fromAyah','toAyah'])
        a,b,s=selection['fromAyah'],selection['toAyah'],selection['surahId']
        if any(type(n) is not int for n in (a,b,s)):raise DomainError('INVALID_SELECTION','أدخل أرقام الآيات الصحيحة.')
        return split_ranges(REF.coverage([{'start':f'{s}:{a}','end':f'{s}:{b}'}]))
    raise DomainError('INVALID_SELECTION','اختر سورة أو أجزاء.')

class Activity:
    @staticmethod
    def capabilities():
        return {'version':'0.6.0','customCommitment':True,'adminShipPreview':True,'customReading':True,'dailyIstighfar':True,'countrySetup':True,'emojiReactions':True,
                'istighfarBounds':{'goalMin':1,'countMin':0,'max':1000000},'reactionPalette':PALETTE,'shipLifecycle':'construction_ready_maintenance_pending'}
    def custom_view(self,a):
        return {'groupId':a['id'],'actId':a['id'],'revision':a['revision'],'selection':a['customSelection'],
                'selectionIntact':not a['retracted'] and REF.coverage(a['ranges'])==REF.coverage(selection_ranges(a['customSelection'])),
                'ranges':split_ranges(REF.coverage(a['ranges'])),'day':act_day(a),'retracted':a['retracted'],'corrected':a['revision']>1}
    def custom_groups(self,member,day):
        return [self.custom_view(a) for a in self.state(member)['acts'].values() if a.get('customGroupId') and act_day(a)==day]
    def _activity_occurrence(self,member,body):
        self.account(member)
        # Explicit custom/history reports can precede membership; absence of an
        # assignment must withhold credit rather than discard factual evidence.
        return occurrence(body,self.now())
    def custom_receipt(self,member,act):
        day=act_day(act);segments=self._segments(member,day,persist=True)
        coverage=frozenset() if act['retracted'] else REF.coverage(act['ranges'])
        return {**self.custom_view(act),'communityDay':day,'creditedIntersections':[{'assignmentId':s['id'],'ranges':split_ranges(coverage & REF.coverage(s['ranges']))} for s in segments],
                'today':self.today(member,day) if segments else None,'projectionRevision':self.community_cursor()}
    def community_cursor(self):
        from .community import Community
        return Community(self).cursor()
    def custom(self,member,body):
        fields(body,['mutationId','referenceVersion','selection','occurredAt','occurrenceDate','timezone','utcOffsetMinutes'],['ranges'])
        if body['referenceVersion']!=REF.version:raise DomainError('INCOMPATIBLE_SNAPSHOT','حدّث مرجع القرآن قبل حفظ القراءة.',409)
        ranges=selection_ranges(body['selection']);coverage=REF.coverage(ranges)
        if 'ranges' in body and REF.coverage(body['ranges'])!=coverage:raise DomainError('SELECTION_RANGE_MISMATCH','نطاق القراءة لا يطابق الاختيار.')
        at=self._activity_occurrence(member,body);day=mecca_day(at);segments=self._segments(member,day,persist=True)
        # Keep evidence even if the assignment's rule is unresolved or there is no assignment.
        state=self.state(member)
        active=[c for c in state['commitments'] if instant(c['effectiveAt'])<=at]
        snap=next((s for s in segments if active and s['commitmentId']==active[-1]['id']),None)
        id=str(uuid5(NAMESPACE_URL,member+':custom:'+body['mutationId']));now=self.timestamp()
        act={'id':id,'memberId':member,'revision':1,'revisionOf':None,'retracted':False,
             **{k:body[k] for k in ('occurredAt','occurrenceDate','timezone','utcOffsetMinutes','referenceVersion','mutationId')},
             'customGroupId':id,'customSelection':body['selection'],'source':'custom_reading','ruleVersion':RULE,
             'assignmentId':snap['id'] if snap else None,'assignmentDay':day,'communityDay':day,
             'cycleId':snap['cycle']['id'] if snap else None,'freeDay':civil(day).weekday()==5,
             'ranges':ranges,'repeatOfActId':None,'traceId':None,'createdAt':now,'updatedAt':now,'confirmationState':'member_confirmed'}
        self.store.event(member,'ReadingRecorded',id,act,now);self.store.record('ReadingAct',member+':'+id,member,act)
        self._materialize(member)
        return self.custom_receipt(member,act)
    def custom_correct(self,member,id,body,retract=False):
        fields(body,['mutationId','expectedRevision','reason']+([] if retract else ['ranges','referenceVersion']))
        old=self.state(member)['acts'].get(id)
        if not old or not old.get('customGroupId'):raise DomainError('NOT_FOUND','القراءة غير موجودة.',404)
        correction={**body}
        if not retract:correction['ruleVersion']=old['ruleVersion']
        act=self._correct(member,id,correction,self.state(member),retract)['act']
        self._materialize(member)
        return self.custom_receipt(member,act)
    def istighfar(self,member,day):
        civil(day);row=self.store.db.execute('SELECT payload FROM istighfar_days WHERE member_id=? AND day=?',(member,day)).fetchone()
        if row:return json.loads(row['payload'])
        row=self.store.db.execute('SELECT profile FROM accounts WHERE member_id=?',(member,)).fetchone()
        goal=json.loads(row['profile']).get('istighfarGoal') if row else None
        return {'day':day,'count':0,'target':goal,'complete':False,'revision':0,'updatedAt':None,'occurredAt':None,'targetPinned':False}
    def goal_put(self,member,body):
        fields(body,['mutationId','expectedRevision','istighfarGoal']);bounded_count(body['istighfarGoal'],1)
        a=self.account(member)
        if type(body['expectedRevision']) is not int or body['expectedRevision']!=a['revision']:raise DomainError('REVISION_CONFLICT','تغيّر الملف الشخصي. حدّث الصفحة.',409,currentRevision=a['revision'])
        p=json.loads(a['profile']);p['istighfarGoal']=body['istighfarGoal']
        self.store.db.execute('UPDATE accounts SET profile=?,revision=revision+1 WHERE member_id=?',(canonical(p),member))
        self.store.event(member,'IstighfarGoalChanged',member,{'goal':p['istighfarGoal'],'profileRevision':a['revision']+1},self.timestamp())
        return self.me(member)
    def activity_today(self,member,day):
        return self.today(member,day) if self._segments(member,day) else None
    def istighfar_put(self,member,body):
        fields(body,['mutationId','day','expectedRevision','count','occurredAt','timezone','utcOffsetMinutes'],['occurrenceDate'])
        bounded_count(body['count']);civil(body['day'])
        b={**body,'occurrenceDate':body.get('occurrenceDate',instant(body['occurredAt']).astimezone(zone(body['timezone'])).date().isoformat())}
        at=self._activity_occurrence(member,b)
        if mecca_day(at)!=body['day']:raise DomainError('ASSIGNMENT_DAY_MISMATCH','وقت الذكر لا يطابق اليوم بتوقيت مكة.',409)
        old=self.istighfar(member,body['day'])
        if type(body['expectedRevision']) is not int or body['expectedRevision']!=old['revision']:raise DomainError('REVISION_CONFLICT','تغيّر عدد اليوم على جهاز آخر.',409,current=old)
        if body['count']==old['count']:return {**old,'projectionRevision':self.community_cursor(),'today':self.activity_today(member,body['day'])}
        goal=json.loads(self.account(member)['profile']).get('istighfarGoal')
        target=old['target'] if old['targetPinned'] else goal
        if not target:raise DomainError('SETUP_REQUIRED','حدّد هدف الاستغفار أولاً.',409)
        value={'day':body['day'],'count':body['count'],'target':target,'complete':body['count']>=target,
               'revision':old['revision']+1,'updatedAt':self.timestamp(),'occurredAt':body['occurredAt'],'targetPinned':True}
        self.store.db.execute('INSERT INTO istighfar_days VALUES(?,?,?,?) ON CONFLICT(member_id,day) DO UPDATE SET payload=excluded.payload,revision=excluded.revision',(member,body['day'],canonical(value),value['revision']))
        self.store.event(member,'IstighfarReported',member+':'+body['day'],{**value,'mutationId':body['mutationId'],'timezone':body['timezone'],'utcOffsetMinutes':body['utcOffsetMinutes']},self.timestamp())
        from .community import Community
        Community(self).rebuild(member)
        return {**value,'projectionRevision':self.community_cursor(),'today':self.activity_today(member,body['day'])}
    def ship_visual(self,member):
        self.account(member)
        return {'schemaVersion':'1.0.0-proposed','assetVersion':'0.5.0','vesselId':str(uuid5(NAMESPACE_URL,'safina-vessel:'+member)),
                'revision':0,'generatedAt':self.timestamp(),'lifecyclePolicyId':'founder-ship-lifecycle-2026-10-01.v1',
                'status':'awaiting_policy','state':None,'blockedReasons':['construction_day_basis','rest_day_settlement','member_timezone_assignment_mapping','late_correction_replay','existing_member_activation','zero_health_recovery','repair_timing']}
