"""Member-scoped application service; event log is authoritative, records are snapshots."""
import hashlib
import hmac
import json
from datetime import datetime, time, timedelta, timezone
from uuid import UUID, uuid4
from .domain import (ROOT, REF, RULE_VERSION, TIERS, DomainError, assignment, cadence,
                     canonical, civil, coverage_of, cycle_for, digest, evaluate, gate,
                     instant, occurrence, unresolved, zone)

def fields(body,required,optional=()):
    if not isinstance(body,dict): raise DomainError('INVALID_BODY','Expected a JSON object.')
    missing=set(required)-set(body); unknown=set(body)-set(required)-set(optional)
    if missing or unknown: raise DomainError('INVALID_FIELDS','Check request fields.',missing=sorted(missing),unknown=sorted(unknown))

def uuid(value):
    try:
        if str(UUID(value))!=value: raise ValueError()
    except (ValueError,TypeError,AttributeError): raise DomainError('INVALID_UUID','Expected a canonical UUID.')
    return value

def text_field(value,max_length=2000):
    if not isinstance(value,str) or not value.strip() or len(value)>max_length: raise DomainError('INVALID_TEXT','Expected nonempty bounded text.')
    return value

def act_day(act):
    return act.get('assignmentDay',act['occurrenceDate'])

class Service:
    def __init__(self,store,now=None,signing_key=None):
        self.store=store
        self.clock=now or (lambda:datetime.now(timezone.utc))
        self.signing_key=signing_key
    def now(self): return self.clock().astimezone(timezone.utc)
    def timestamp(self): return self.now().isoformat()
    def provision(self,member,tier,tz,start_date):
        cadence(tier); z=zone(tz); d=civil(start_date)
        if d>self.now().astimezone(z).date(): raise DomainError('FUTURE_START','Start date cannot be in the future.')
        with self.store.transaction():
            token=self.store.create_member(text_field(member,100),tz,self.timestamp())
            c={'id':str(uuid4()),'tier':tier,'effectiveAt':datetime.combine(d,time.min,z).astimezone(timezone.utc).isoformat(),'timezone':tz,'initial':True}
            self.store.event(member,'CommitmentSet',c['id'],c,self.timestamp())
            self.store.record('Commitment',c['id'],member,c)
        return {'memberId':member,'token':token}
    def state(self,member):
        self.store.member(member)
        s={'commitments':[],'acts':{},'traces':{},'dhikrGoals':{},'dhikrCounts':{},'preferences':{}}
        for e in self.store.events(member):
            p=e['payload']; k=e['kind']
            if k=='CommitmentSet': s['commitments'].append(p)
            elif k in ('ReadingRecorded','ReadingCorrected','ReadingRetracted'): s['acts'][p['id']]=p
            elif k in ('TraceObserved','TraceDiscarded'):s['traces'][p['id']]=p
            elif k=='DhikrGoalSet':s['dhikrGoals'][p['id']]=p
            elif k=='DhikrCountSet':s['dhikrCounts'][p['id']]=p
            elif k=='ReminderSet':s['preferences']=p
        s['commitments'].sort(key=lambda c:instant(c['effectiveAt']))
        return s
    def _commitment_at(self,s,at):
        cs=[c for c in s['commitments'] if instant(c['effectiveAt'])<=at]
        if not cs: raise DomainError('COMMITMENT_NOT_ACTIVE','No commitment existed at the occurrence time.',409)
        return cs[-1]
    def _make_assignment(self,member,day,c,tz):
        return assignment(day,c['tier'],c['id'],member,tz)
    def _validate_occurrence_snapshot(self,body,snap,at):
        if snap['date']!=body['occurrenceDate'] or body.get('assignmentDay',snap['date'])!=snap['date']:
            raise DomainError('SNAPSHOT_DATE_MISMATCH','Occurrence date must match the pinned assignment.',409)
    def _is_travel(self,member,a):
        return a['timezone']!=self.store.member(member)['timezone']
    def _segments(self,member,day,s=None,persist=False):
        s=s or self.state(member); m=self.store.member(member); z=zone(m['timezone']); d=civil(day)
        start=datetime.combine(d,time.min,z).astimezone(timezone.utc)
        end=datetime.combine(d+timedelta(days=1),time.min,z).astimezone(timezone.utc)
        cs=s['commitments']; selected=[]
        for i,c in enumerate(cs):
            next_at=instant(cs[i+1]['effectiveAt']) if i+1<len(cs) else datetime.max.replace(tzinfo=timezone.utc)
            if instant(c['effectiveAt'])<end and next_at>start:
                a=self._make_assignment(member,day,c,m['timezone']); selected.append(a)
                if persist:
                    self.store.record('AssignmentSnapshot',a['id'],member,a)
                    self.store.record('AssignmentSegment',a['id'],member,{'assignmentId':a['id'],'commitmentId':c['id'],'date':day,'effectiveAt':c['effectiveAt']})
                    if a['cadence']=='weekly':self.store.record('WeeklyCycle',member+':'+a['cycle']['id'],member,a['cycle'])
                    elif a['cadence']=='monthly':
                        schedule={'id':f"{a['ruleVersion']}:{a['tier']}:{day}",'ruleVersion':a['ruleVersion'],'referenceVersion':REF.version,'date':day,'tier':a['tier'],'ranges':a['ranges'],'status':a['status'],'approvalSource':'supplied founder request; exact confirmed template only','openPolicies':a['openPolicies']}
                        if a['tier']=='CUSTOM':schedule['id']+=':'+c['id']
                        self.store.record('MonthlySchedule',schedule['id'],None,schedule)
        return selected
    def _active(self,s,day=None):
        return [a for a in s['acts'].values() if not a['retracted'] and (day is None or act_day(a)==day)]
    def day(self,member,day,s=None):
        s=s or self.state(member); segments=self._segments(member,day,s); acts=self._active(s,day)
        travel=any(self._is_travel(member,a) for a in acts)
        result=evaluate(day,segments,acts,travel)
        result['corrected']=any(a['revision']>1 for a in s['acts'].values() if act_day(a)==day)
        result['readerObservedTrace']=[t for t in s['traces'].values() if t['occurrenceDate']==day]
        return result
    def today(self,member,day=None):
        m=self.store.member(member); day=day or self.now().astimezone(zone(m['timezone'])).date().isoformat()
        if civil(day)>self.now().astimezone(zone(m['timezone'])).date(): raise DomainError('FUTURE_DATE','Future assignments are not published by this endpoint.')
        s=self.state(member); segments=self._segments(member,day,s,persist=True)
        if not segments: raise DomainError('COMMITMENT_NOT_ACTIVE','No commitment on this date.',409)
        # Historical queries use the final segment; current date excludes future queued commitments.
        a=segments[-1]; k=self.khatmas(member,s,through=day)
        cycle=next((x for x in k['cycles'] if x['id']==a['cycle']['id']),None)
        if not cycle:cycle=self._cycle_result(member,a['cycle'],[],[],False)
        return {'assignment':a,'segments':segments,'evaluation':self.day(member,day,s),
                'khatmaCoverage':cycle,'nextUnreadVerse':cycle['nextUnreadVerse'],
                'dataProvenance':REF.data['provenance'],
                'queuedChanges':[c for c in s['commitments'] if instant(c['effectiveAt'])>self.now()],
                'readerText':{'status':'unavailable','openPolicy':unresolved('quran_assets')}}
    def calendar(self,member,start,end):
        a,b=civil(start),civil(end)
        if b<a or (b-a).days>365:raise DomainError('INVALID_DATE_RANGE','Calendar range must contain 1–366 days.')
        s=self.state(member); proofs=self.khatmas(member,s,through=end)['cycles']; days=[]
        for n in range((b-a).days+1):
            day=(a+timedelta(days=n)).isoformat(); ev=self.day(member,day,s)
            ev['khatmaMarks']=[p['proofHash'] for p in proofs if p['status']=='complete' and p['completionDate']==day]
            days.append(ev)
        return {'visibility':'private','days':days}
    def _cycle_result(self,member,cycle,acts,excluded,travel):
        actual=coverage_of(acts); complete=actual==REF.all; missing=REF.all-actual
        ordered=sorted(acts,key=lambda a:(instant(a['occurredAt']),a['id'])); running=set(); completion=None
        for a in ordered:
            running.update(REF.coverage(a['ranges']))
            if len(running)==len(REF.all):completion=act_day(a);break
        proof=digest({'referenceVersion':REF.version,'cycle':cycle,'acts':[{'id':a['id'],'revision':a['revision'],'ranges':a['ranges']} for a in sorted(acts,key=lambda a:a['id'])]}) if complete and not travel else None
        return {**cycle,'status':'awaiting_policy' if travel else ('complete' if complete else 'incomplete'),
                'uniqueCoverage':REF.ranges(actual),'coveredVerses':len(actual),'totalVerses':len(REF.all),
                'remainingRanges':REF.ranges(missing),'nextUnreadVerse':REF.keys[min(missing)] if missing else None,
                'completedJuz':[j for j in range(1,31) if REF.juz(j)<=actual],
                'proofHash':proof,'completionDate':completion if proof else None,'ordinal':1 if proof else None,
                'sourceActRevisions':[{'id':a['id'],'revision':a['revision']} for a in acts],
                'additionalKhatmas':{'status':'awaiting_policy','policy':unresolved('repeat_khatma')},
                'excludedFreeDayActs':[a['id'] for a in excluded],
                'openPolicies':([unresolved('pause_travel')] if travel else [])+([unresolved('free_day_khatma')] if excluded else [])}
    def khatmas(self,member,s=None,through=None):
        s=s or self.state(member); m=self.store.member(member)
        through=through or self.now().astimezone(zone(m['timezone'])).date().isoformat(); stop=civil(through)
        cycles={}
        if s['commitments']:
            first=instant(s['commitments'][0]['effectiveAt']).astimezone(zone(m['timezone'])).date()
            if (stop-first).days>3660:raise DomainError('HISTORY_WINDOW_LIMIT','Local slice supports up to ten years of history.',409)
            for n in range(max(0,(stop-first).days+1)):
                for a in self._segments(member,(first+timedelta(days=n)).isoformat(),s):cycles[a['cycle']['id']]=a['cycle']
        results=[]
        for c in sorted(cycles.values(),key=lambda c:c['start']):
            acts=[a for a in self._active(s) if a['cycleId']==c['id'] and act_day(a)<=through]
            excluded=[a for a in acts if self._exclude_from_khatma(a,c)]
            acts=[a for a in acts if a not in excluded]
            travel=any(self._is_travel(member,a) for a in acts)
            results.append(self._cycle_result(member,c,acts,excluded,travel))
        return {'visibility':'private','referenceVersion':REF.version,'cycles':results}
    def _exclude_from_khatma(self,a,c):
        return a.get('freeDay') and c['cadence']=='monthly'
    def ship(self,member,s=None):
        s=s or self.state(member); days=sorted({act_day(a) for a in s['acts'].values()})
        evaluations=[self.day(member,d,s) for d in days]; totals={}
        for e in evaluations: totals[e['date'][:7]]=totals.get(e['date'][:7],0)+(e['dayCredit'] or 0)
        unresolved_days=[e['date'] for e in evaluations if e['dayCredit'] is None]
        return {'visibility':'private','approvedCredits':sum(totals.values()),'creditsPerShip':30,
                'periods':[{'month':k,'approvedCredits':v,'completedShipsWithinPeriod':v//30} for k,v in sorted(totals.items())],
                'completedShipsWithinPeriods':sum(v//30 for v in totals.values()),
                'currentShip':None,'lifetimeShipCount':None,'presentationStatus':'awaiting_policy',
                'openPolicies':[unresolved('ship_carry')], 'unresolvedDayCredits':unresolved_days,
                'ledger':[{'date':e['date'],'credit':e['dayCredit'],'inputHash':e['inputHash']} for e in evaluations]}
    def _snapshot(self,member,id):
        row=self.store.db.execute("SELECT payload FROM records WHERE kind='AssignmentSnapshot' AND id=? AND member_id=?",(id,member)).fetchone()
        if not row:raise DomainError('SNAPSHOT_NOT_FOUND','Obtain the member’s assignment snapshot first.',409)
        return json.loads(row[0])
    def _versions(self,body):
        if body['ruleVersion']!=RULE_VERSION or body['referenceVersion']!=REF.version:raise DomainError('INCOMPATIBLE_SNAPSHOT','Rule or reference version is incompatible; preserve the offline entry and resolve explicitly.',409,currentRuleVersion=RULE_VERSION,currentReferenceVersion=REF.version)
    def _record_reading(self,member,body,s):
        required=['mutationId','logicalActId','occurrenceDate','occurredAt','timezone','utcOffsetMinutes','ranges','source','assignmentId','ruleVersion','referenceVersion']
        fields(body,required,['repeatOfActId','traceId','componentId','assignmentDay'])
        self._versions(body); at=occurrence(body,self.now()); id=uuid(body['logicalActId'])
        if id in s['acts']:raise DomainError('ACT_ALREADY_EXISTS','This logical act already exists. Correct it with its current revision.',409,actId=id,currentRevision=s['acts'][id]['revision'])
        if body['source'] not in ('manual_physical','manual','reader_confirmed','component_self_report'):raise DomainError('INVALID_SOURCE','Only deliberate member reading reports can create an act.')
        snap=self._snapshot(member,body['assignmentId'])
        self._validate_occurrence_snapshot(body,snap,at)
        if body['ruleVersion']!=snap['ruleVersion'] or body['referenceVersion']!=snap['referenceVersion']:
            raise DomainError('INCOMPATIBLE_SNAPSHOT','Entry versions differ from its pinned assignment.',409)
        expected=self._commitment_at(s,at)
        if snap['commitmentId']!=expected['id']:raise DomainError('STALE_ASSIGNMENT','The assignment was not active at the occurrence instant; reconcile the entry explicitly.',409)
        covered=REF.coverage(body['ranges'])
        if not covered:raise DomainError('EMPTY_READING','An empty entry is not a reading act.')
        if body['source']=='component_self_report' and not body.get('componentId'):
            raise DomainError('COMPONENT_REQUIRED','A whole-row report needs its component ID.')
        if body.get('componentId'):
            component=next((c for c in snap['components'] if c['id']==body['componentId']),None)
            if not component or covered!=REF.coverage(component['ranges']):raise DomainError('COMPONENT_MISMATCH','A whole-row report must match that component exactly; use exact ranges for partial reading.')
        repeat=body.get('repeatOfActId')
        if repeat:
            if repeat not in s['acts'] or s['acts'][repeat]['retracted']:raise DomainError('REPEAT_NOT_FOUND','Repeat origin must be an active act owned by this member.',404)
            if not covered & REF.coverage(s['acts'][repeat]['ranges']):raise DomainError('INVALID_REPEAT','A repeated act must overlap its stated origin.')
        for old in self._active(s,body.get('assignmentDay',body['occurrenceDate'])):
            if covered==REF.coverage(old['ranges']) and not repeat:raise DomainError('POSSIBLE_DUPLICATE','This exact range is already recorded today; reuse its logical ID, correct it, or explicitly report a real repeat.',409,existingActId=old['id'])
        trace=None
        if body['source']=='reader_confirmed':
            trace=s['traces'].get(body.get('traceId'))
            if not trace or trace['discarded']:raise DomainError('TRACE_NOT_FOUND','A reader confirmation requires this member’s active trace.',404)
            if trace['occurrenceDate']!=body['occurrenceDate']:raise DomainError('TRACE_DATE_MISMATCH','Trace and act occurrence dates must agree.',409)
            if any(a.get('traceId')==trace['id'] for a in s['acts'].values()):raise DomainError('TRACE_ALREADY_CONFIRMED','Correct the original confirmation to avoid recording the trace twice.',409)
        elif body.get('traceId'):raise DomainError('INVALID_TRACE_SOURCE','Trace linkage requires reader_confirmed source.')
        now=self.timestamp()
        act={'id':id,'memberId':member,'revision':1,'revisionOf':None,'retracted':False,
             **{k:body[k] for k in ('occurrenceDate','occurredAt','timezone','utcOffsetMinutes','source','assignmentId','ruleVersion','referenceVersion')},
             'ranges':REF.ranges(covered),'repeatOfActId':repeat,'traceId':trace['id'] if trace else None,
             'cycleId':snap['cycle']['id'],'freeDay':snap['freeDay'],'createdAt':now,'updatedAt':now,
             'mutationId':body['mutationId'],'confirmationState':'member_confirmed'}
        if 'assignmentDay' in body:act['assignmentDay']=body['assignmentDay'];act['communityDay']=body['assignmentDay']
        if 'componentId' in body:act['componentId']=body['componentId']
        self.store.event(member,'ReadingRecorded',id,act,now);self.store.record('ReadingAct',member+':'+id,member,act)
        return {'act':act}
    def _correct(self,member,id,body,s,retract=False):
        fields(body,['mutationId','expectedRevision','reason']+([] if retract else ['ranges','ruleVersion','referenceVersion']))
        old=s['acts'].get(id)
        if not old:raise DomainError('NOT_FOUND','Reading act not found.',404)
        if type(body['expectedRevision'])!=int or body['expectedRevision']!=old['revision']:raise DomainError('REVISION_CONFLICT','The act changed; review the current revision before retrying.',409,currentRevision=old['revision'])
        if old['retracted']:raise DomainError('ACT_RETRACTED','Retracted acts cannot be edited; record a new deliberate act.',409)
        text_field(body['reason'],500)
        ranges=old['ranges']
        if not retract:
            self._versions(body)
            if body['ruleVersion']!=old['ruleVersion'] or body['referenceVersion']!=old['referenceVersion']:
                raise DomainError('INCOMPATIBLE_SNAPSHOT','Correction must retain the original rule/reference.',409)
            ranges=REF.ranges(REF.coverage(body['ranges']))
            if not ranges:raise DomainError('EMPTY_READING','Use the retraction endpoint to remove an act.')
        act={**old,'ranges':ranges,'retracted':retract,'revision':old['revision']+1,'revisionOf':old['revision'],
             'revisionReason':body['reason'],'updatedAt':self.timestamp(),'mutationId':body['mutationId']}
        self.store.event(member,'ReadingRetracted' if retract else 'ReadingCorrected',id,act,self.timestamp())
        self.store.record('ReadingRevision',member+':'+id,member,act,act['revision'])
        return {'act':act,'explanation':'Your reading record was corrected. Day credit, ship accounting and khatma coverage have been recalculated from active reports.'}
    def _change(self,member,body,s):
        fields(body,['mutationId','tier','expectedCommitmentId','ruleVersion'])
        cadence(body['tier']); old=self._commitment_at(s,self.now())
        if body['ruleVersion']!=old.get('ruleVersion',RULE_VERSION):raise DomainError('INCOMPATIBLE_SNAPSHOT','Refresh the rule registry.',409)
        if old['id']!=body['expectedCommitmentId']:raise DomainError('COMMITMENT_CONFLICT','The commitment changed; refresh before retrying.',409)
        if any(instant(c['effectiveAt'])>self.now() for c in s['commitments']):raise DomainError('CHANGE_ALREADY_QUEUED','A future change is already queued.',409)
        if old['tier']==body['tier']:raise DomainError('UNCHANGED_COMMITMENT','Choose a different tier.',409)
        weekly=lambda t:cadence(t)=='weekly'
        if weekly(old['tier'])!=weekly(body['tier']):gate('cross_cadence')
        z=zone(self.store.member(member)['timezone']); local=self.now().astimezone(z)
        effective=self.now()
        if weekly(old['tier']):
            days=(6-local.weekday())%7 or 7
            effective=datetime.combine(local.date()+timedelta(days=days),time.min,z).astimezone(timezone.utc)
        c={'id':str(uuid4()),'tier':body['tier'],'effectiveAt':effective.isoformat(),'timezone':str(z),'initial':False,'previousId':old['id'],'requestedAt':self.timestamp()}
        if 'ruleVersion' in old:c['ruleVersion']=old['ruleVersion']
        self.store.event(member,'CommitmentSet',c['id'],c,self.timestamp())
        self.store.record('Commitment',c['id'],member,c);self.store.record('CommitmentChange',c['id'],member,c)
        return {'change':c,'creditPolicy':unresolved('same_day_credit') if not weekly(old['tier']) else unresolved('weekly_day_credit')}
    def _trace(self,member,id,body,s,discard=False):
        uuid(id)
        if discard:
            fields(body,['mutationId','expectedRevision'])
            old=s['traces'].get(id)
            if not old:raise DomainError('NOT_FOUND','Reader trace not found.',404)
            if body['expectedRevision']!=old['revision']:raise DomainError('REVISION_CONFLICT','Trace changed.',409)
            t={**old,'discarded':True,'revision':old['revision']+1,'updatedAt':self.timestamp()}
        else:
            fields(body,['mutationId','expectedRevision','occurrenceDate','occurredAt','timezone','utcOffsetMinutes','observations','referenceVersion'])
            if body['referenceVersion']!=REF.version:raise DomainError('INCOMPATIBLE_SNAPSHOT','Unknown reference version.',409)
            occurrence(body,self.now());old=s['traces'].get(id);rev=old['revision'] if old else 0
            if type(body['expectedRevision'])!=int or body['expectedRevision']!=rev:raise DomainError('REVISION_CONFLICT','Trace changed.',409,currentRevision=rev)
            if old and (old['discarded'] or old['occurrenceDate']!=body['occurrenceDate']):raise DomainError('TRACE_CLOSED','Start a new session for another date or a discarded trace.',409)
            observations=body['observations']
            if not isinstance(observations,list) or not 1<=len(observations)<=100:raise DomainError('INVALID_OBSERVATIONS','Supply 1–100 bounded reader observations.')
            suggestion=set()
            for o in observations:
                fields(o,['kind','ranges'])
                if o['kind'] not in ('exposed','navigated','page_opened','audio_played'):raise DomainError('INVALID_OBSERVATION','Unknown observation kind.')
                ranges=REF.coverage(o['ranges'])
                if o['kind'] in ('exposed','navigated'):suggestion.update(ranges)
            t={'id':id,'memberId':member,'revision':rev+1,'occurrenceDate':body['occurrenceDate'],'occurredAt':body['occurredAt'],
               'timezone':body['timezone'],'utcOffsetMinutes':body['utcOffsetMinutes'],'referenceVersion':REF.version,
               'observations':observations,'suggestedRanges':REF.ranges(suggestion),'state':'reader_suggestion',
               'discarded':False,'updatedAt':self.timestamp(),'createdAt':old['createdAt'] if old else self.timestamp(),
               'credit':0,'explanation':'Observed ranges are a provisional suggestion. The member must confirm or replace them.'}
        self.store.event(member,'TraceDiscarded' if discard else 'TraceObserved',id,t,self.timestamp())
        self.store.record('ReaderTrace',member+':'+id,member,t,t['revision'])
        return {'trace':t}
    def trace(self,member,id):
        s=self.state(member); t=s['traces'].get(id)
        if not t:raise DomainError('NOT_FOUND','Reader trace not found.',404)
        return {'trace':t,'confirmedActIds':[a['id'] for a in s['acts'].values() if a.get('traceId')==id]}
    def _dhikr(self,member,body,s,goal=False):
        fields(body,['mutationId','id','expectedRevision','label','target'] if goal else ['mutationId','id','expectedRevision','goalId','date','count'])
        id=uuid(body['id']); coll=s['dhikrGoals'] if goal else s['dhikrCounts'];old=coll.get(id);rev=old['revision'] if old else 0
        if type(body['expectedRevision'])!=int or body['expectedRevision']!=rev:raise DomainError('REVISION_CONFLICT','Dhikr record changed.',409,currentRevision=rev)
        value=body['target' if goal else 'count']
        if type(value)!=int or not 0<=value<=1000000000:raise DomainError('INVALID_COUNT','Expected a nonnegative bounded integer.')
        if goal:text_field(body['label'],120)
        else:
            civil(body['date'])
            if body['goalId'] not in s['dhikrGoals']:raise DomainError('NOT_FOUND','Dhikr goal not found.',404)
        p={k:v for k,v in body.items() if k not in ('mutationId','expectedRevision')};p.update(revision=rev+1,memberId=member,updatedAt=self.timestamp(),readingCredit=0)
        self.store.event(member,'DhikrGoalSet' if goal else 'DhikrCountSet',id,p,self.timestamp())
        self.store.record('DhikrGoal' if goal else 'DhikrCount',member+':'+id,member,p,rev+1)
        return {'record':p}
    def _reminder(self,member,body,s):
        fields(body,['mutationId','enabled','localTime','timezone'])
        if type(body['enabled'])!=bool:raise DomainError('INVALID_PREFERENCE','enabled must be boolean.')
        zone(body['timezone'])
        try:
            if len(body['localTime'])!=5:raise ValueError()
            time.fromisoformat(body['localTime'])
        except (ValueError,TypeError):raise DomainError('INVALID_TIME','Expected HH:MM.')
        p={**body,'deliveryStatus':'not_implemented','revision':s['preferences'].get('revision',0)+1}
        self.store.event(member,'ReminderSet',member,p,self.timestamp());self.store.record('ReminderPreference',member,member,p,p['revision'])
        return p
    def _materialize(self,member):
        s=self.state(member)
        for d in sorted({act_day(a) for a in s['acts'].values()}):
            v=self.day(member,d,s)
            self.store.record('DayEvaluation',member+':'+digest(v),member,v)
            self.store.record('CalendarDay',member+':'+digest(v),member,v)
        k=self.khatmas(member,s);ship=self.ship(member,s)
        for c in k['cycles']:self.store.record('KhatmaRecord',member+':'+digest(c),member,c)
        self.store.record('ShipLedger',member+':'+digest(ship),member,ship)
    def mutate(self,member,operation,body,id=None):
        if not isinstance(body,dict) or 'mutationId' not in body:raise DomainError('MUTATION_ID_REQUIRED','Every mutation needs a UUID mutationId.')
        mutation=uuid(body['mutationId']); fingerprint=digest({'operation':operation,'id':id,'body':body})
        with self.store.transaction():
            self.store.member(member)
            old=self.store.db.execute('SELECT request_hash,response FROM mutations WHERE member_id=? AND mutation_id=?',(member,mutation)).fetchone()
            if old:
                if old[0]!=fingerprint:raise DomainError('IDEMPOTENCY_CONFLICT','Mutation UUID was reused with a different request.',409)
                return json.loads(old[1])
            s=self.state(member)
            if operation=='reading':result=self._record_reading(member,body,s)
            elif operation=='correct':result=self._correct(member,id,body,s)
            elif operation=='retract':result=self._correct(member,id,body,s,True)
            elif operation=='change':result=self._change(member,body,s)
            elif operation=='trace':result=self._trace(member,id,body,s)
            elif operation=='discard_trace':result=self._trace(member,id,body,s,True)
            elif operation=='dhikr_goal':result=self._dhikr(member,body,s,True)
            elif operation=='dhikr_count':result=self._dhikr(member,body,s)
            elif operation=='reminder':result=self._reminder(member,body,s)
            else:raise DomainError('NOT_FOUND','Unknown operation.',404)
            self._materialize(member)
            if 'act' in result:result.update(evaluation=self.day(member,act_day(result['act'])),shipProgress=self.ship(member))
            self.store.db.execute('INSERT INTO mutations VALUES(?,?,?,?)',(member,mutation,fingerprint,canonical(result)))
            return result
    def replay(self,member):
        s=self.state(member)
        days=sorted({act_day(a) for a in s['acts'].values()})
        return {'days':[self.day(member,d,s) for d in days],'ship':self.ship(member,s),'khatmas':self.khatmas(member,s)}
    def offline_snapshot(self,member,day):
        if not self.signing_key:raise DomainError('SIGNING_NOT_CONFIGURED','Configure a server-only signing key for offline snapshot integrity.',503)
        today=self.today(member,day)
        payload={'version':1,'memberId':member,'assignment':today['assignment'],'reference':REF.data,'rules':json.loads((ROOT/'data/program_rules.json').read_text())}
        return {'payload':payload,'algorithm':'HMAC-SHA256','signature':hmac.new(self.signing_key,canonical(payload).encode(),hashlib.sha256).hexdigest(),'verification':'Server-verifiable only. Client previews remain provisional; no client secret is distributed.'}
    def verify_snapshot(self,member,envelope):
        fields(envelope,['payload','signature','algorithm','verification'])
        if not self.signing_key:raise DomainError('SIGNING_NOT_CONFIGURED','Snapshot verification is not configured.',503)
        if envelope['algorithm']!='HMAC-SHA256':raise DomainError('INVALID_SIGNATURE','Unknown signature algorithm.',409)
        expected=hmac.new(self.signing_key,canonical(envelope['payload']).encode(),hashlib.sha256).hexdigest()
        if not isinstance(envelope['signature'],str) or not hmac.compare_digest(expected,envelope['signature']):raise DomainError('INVALID_SIGNATURE','Offline snapshot has been altered.',409)
        p=envelope['payload']
        if p.get('memberId')!=member:raise DomainError('FORBIDDEN','Snapshot belongs to another member.',403)
        self._versions(p['assignment'])
        if self._snapshot(member,p['assignment']['id'])!=p['assignment']:raise DomainError('INCOMPATIBLE_SNAPSHOT','Assignment differs from its immutable server record.',409)
        return {'valid':True,'assignmentId':p['assignment']['id']}
