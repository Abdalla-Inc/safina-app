"""Pure, deterministic reading and assignment rules. No database or network access."""
import calendar
import hashlib
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

ROOT = Path(__file__).resolve().parents[1]
RULE_VERSION = 'founder-core-2026-09-28.v1'
TIERS = ('B', 'BI', 'BJ1', 'BJ2', 'BJ3', 'BJ4', 'BJ5')
QUESTIONS = {
 'february_grid':'Which February dates carry the remaining portions?',
 'monthly_continuation':'Which exact verse ranges follow the BJ2 day-one B fixture and define BJ3?',
 'weekly_day_credit':'What approved personal daily target earns a full credit for flexible weekly reading?',
 'same_day_credit':'How should old and new monthly assignment segments combine for one day credit?',
 'cross_cadence':'When does a monthly/daily to weekly or weekly to monthly/daily change take effect?',
 'partial_credit':'Should partial reading earn fractional credit, and with which pinned word denominator?',
 'ship_carry':'Does unfinished construction continue across periods or remain a dated unfinished ship?',
 'pause_travel':'What are the pause and travel/timezone cutoffs?',
 'repeat_khatma':'How are explicit repeat acts attributed to multiple khatmas?',
 'free_day_khatma':'May monthly day-31 catch-up establish a khatma in the ending cycle?',
 'group_policy':'What sharing, moderation, correction/retraction and retention rules are approved?',
 'quran_assets':'Which text, word map, fonts and audio editions and rights are approved?',
 'classroom_policy':'Which curriculum, grading and entitlement rules are approved?',
 'library_rights':'Which source rights and reviewed transcripts may be published and searched?',
}
class DomainError(Exception):
    def __init__(self, code, message, status=422, **details):
        super().__init__(message)
        self.code, self.message, self.status, self.details = code, message, status, details
    def body(self):
        return {'error': {'code':self.code,'message':self.message,**self.details}}

def unresolved(key, code='RULE_NOT_APPROVED'):
    return {'code':code,'policy':key,'question':QUESTIONS[key], 'ruleVersion':RULE_VERSION}

def gate(key, code='RULE_NOT_APPROVED'):
    u = unresolved(key, code)
    raise DomainError(u.pop('code'), 'Founder decision is required.', 409, **u)

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def civil(value):
    try:
        if not isinstance(value,str) or len(value)!=10: raise ValueError()
        return date.fromisoformat(value)
    except (ValueError,TypeError):
        raise DomainError('INVALID_DATE','Expected an ISO civil date: YYYY-MM-DD.')

def zone(value):
    try: return ZoneInfo(value)
    except (ZoneInfoNotFoundError,ValueError,TypeError):
        raise DomainError('INVALID_TIMEZONE','Expected an IANA timezone.')

def instant(value):
    try:
        t = datetime.fromisoformat(value.replace('Z','+00:00'))
        if t.tzinfo is None: raise ValueError()
        return t.astimezone(timezone.utc)
    except (ValueError,TypeError,AttributeError):
        raise DomainError('INVALID_INSTANT','Expected an ISO timestamp with an explicit offset.')

def occurrence(body, now):
    t = instant(body['occurredAt'])
    local = t.astimezone(zone(body['timezone']))
    if local.date()!=civil(body['occurrenceDate']) or type(body['utcOffsetMinutes']) is not int or int(local.utcoffset().total_seconds()/60)!=body['utcOffsetMinutes']:
        raise DomainError('OCCURRENCE_MISMATCH','Date, IANA zone, UTC offset and occurrence instant must agree.')
    if t>now: raise DomainError('FUTURE_READING','Reading cannot be reported before it occurs.')
    return t

def cadence(tier):
    if tier not in TIERS: raise DomainError('INVALID_TIER','Unknown commitment tier.')
    return 'weekly' if tier in ('BJ4','BJ5') else ('daily' if tier in ('B','BI') else 'monthly')

def cycle_for(day, tier):
    d = civil(day)
    if cadence(tier)=='weekly':
        start=d-timedelta(days=(d.weekday()+1)%7); end=start+timedelta(days=6); kind='weekly'
    else:
        start=d.replace(day=1); end=d.replace(day=calendar.monthrange(d.year,d.month)[1]); kind='monthly'
    return {'id':f'{kind}:{start.isoformat()}', 'cadence':kind,'start':start.isoformat(),'end':end.isoformat()}

class Reference:
    def __init__(self):
        self.data=json.loads((ROOT/'data/reference.json').read_text())
        self.version=self.data['version']
        self.keys=[f'{s}:{a}' for s,n in enumerate(self.data['verseCounts'],1) for a in range(1,n+1)]
        self.indices={k:i for i,k in enumerate(self.keys)}
        self.all=frozenset(range(len(self.keys)))
        self.b=self.coverage([{'start':'2:1','end':'2:286'}])
        self.bi=self.coverage([{'start':'2:1','end':'3:200'}])
        assert len(self.keys)==6236 and len(self.data['verseCounts'])==114
        assert len(self.data['juzStarts'])==30
        self._partition(self.data['juzStarts'])
        self._partition(self.data['pageMap']['starts'])
    def index(self, key):
        if not isinstance(key,str) or key not in self.indices: raise DomainError('INVALID_VERSE','Unknown canonical surah:ayah.')
        return self.indices[key]
    def coverage(self,ranges):
        if not isinstance(ranges,list) or len(ranges)>200: raise DomainError('INVALID_RANGES','Expected up to 200 inclusive verse ranges.')
        result=set()
        for r in ranges:
            if not isinstance(r,dict) or set(r)!={'start','end'}: raise DomainError('INVALID_RANGE','A range needs exactly start and end verse keys; partial-word reporting is not available.')
            a,b=self.index(r['start']),self.index(r['end'])
            if b<a: raise DomainError('INVALID_RANGE','Range end precedes its start.')
            result.update(range(a,b+1))
        return frozenset(result)
    def ranges(self,values):
        items=sorted(values)
        if not items:return []
        result=[]; start=last=items[0]
        for i in items[1:]:
            if i!=last+1:
                result.append({'start':self.keys[start],'end':self.keys[last]}); start=i
            last=i
        return result+[{'start':self.keys[start],'end':self.keys[last]}]
    def _partition(self,starts):
        points=[self.index(k) for k in starts]+[len(self.keys)]
        assert points[0]==0 and all(a<b for a,b in zip(points,points[1:]))
        return [frozenset(range(a,b)) for a,b in zip(points,points[1:])]
    def juz(self,n):
        if type(n)!=int or not 1<=n<=30: raise DomainError('INVALID_JUZ','Expected juz 1 through 30.')
        return self._partition(self.data['juzStarts'])[n-1]
    def page(self,edition,version,n):
        m=self.data['pageMap']
        if edition!=m['edition'] or version!=m['version']: raise DomainError('PAGE_MAP_NOT_AVAILABLE','Edition and map version must match a pinned page map.',409)
        if type(n)!=int or not 1<=n<=604: raise DomainError('INVALID_PAGE','Expected a page in this edition.')
        return {'edition':edition,'mapVersion':version,'page':n,'referenceVersion':self.version,'ranges':self.ranges(self._partition(m['starts'])[n-1])}

REF=Reference()

def assignment(day,tier,commitment_id,member_id,tz):
    d=civil(day); cad=cadence(tier); cyc=cycle_for(day,tier)
    components=[]; policies=[]; free=False; status='published'
    if cad=='monthly' and d.day==31:
        free=True; status='free_day'
    elif tier=='B': components=[('B',REF.b)]
    elif tier=='BI': components=[('B',REF.b),('I',REF.bi-REF.b)]
    elif tier=='BJ2' and d.day==1: components=[('B',REF.b)]
    elif tier=='BJ5' and d.weekday()==5:
        free=True; status='free_day'
    elif cad=='weekly':
        status='awaiting_policy'; policies=[unresolved('weekly_day_credit')]
        # Weekly remainder is factual; a daily denominator is deliberately absent.
    elif d.month==2:
        status='awaiting_policy'; policies=[unresolved('february_grid','SCHEDULE_NOT_PUBLISHED')]
    elif tier=='BJ1': components=[('B',REF.b),(f'J{d.day}',REF.juz(d.day))]
    else:
        status='awaiting_policy'; policies=[unresolved('monthly_continuation','SCHEDULE_NOT_PUBLISHED')]
    target=set().union(*(c[1] for c in components)) if components else set()
    result={'memberId':member_id,'date':day,'tier':tier,'tierLabel':tier,'colorToken':f'level.{tier}',
            'patternToken':f'level-pattern.{tier}','cadence':cad,'cycle':cyc,'timezone':tz,
            'commitmentId':commitment_id,'ruleVersion':RULE_VERSION,'referenceVersion':REF.version,
            'scheduleVersion':RULE_VERSION+':confirmed-templates','status':status,'freeDay':free,
            'components':[{'id':k,'label':k,'ranges':REF.ranges(v),'reportMeaning':'member_self_report'} for k,v in components],
            'ranges':REF.ranges(target),'openPolicies':policies}
    result['id']='as_'+digest(result)[:32]
    return result

def coverage_of(acts):
    return frozenset().union(*(REF.coverage(a['ranges']) for a in acts))

def evaluate(day,segments,acts,travel=False):
    unique=coverage_of(acts); targets=frozenset().union(*(REF.coverage(a['ranges']) for a in segments))
    matched=unique&targets; supplemental=unique-targets
    policies=[]
    if travel: policies.append(unresolved('pause_travel'))
    if len(segments)>1: policies.append(unresolved('same_day_credit'))
    for s in segments: policies.extend(s['openPolicies'])
    free=bool(segments) and all(s['freeDay'] for s in segments)
    if free: status='free_day'; credit=0
    elif not acts: status='no_entry'; credit=0
    elif not targets or policies: status='recorded_awaiting_policy'; credit=None
    elif targets<=unique: status='completed'; credit=1
    elif matched: status='partial'; credit=None; policies.append(unresolved('partial_credit'))
    else: status='supplemental_only'; credit=0
    if acts and travel: credit=None
    result={'date':day,'status':status,'actualReadingStatus':'member_confirmed' if acts else 'no_entry',
            'uniqueCoverage':REF.ranges(unique),'uniqueVerseCount':len(unique),
            'repeatedActs':[a['id'] for a in acts if a.get('repeatOfActId')],
            'assignedFulfilment':{'ranges':REF.ranges(matched),'matchedVerses':len(matched),'targetVerses':len(targets),
                                 'complete':targets<=unique if targets and not policies else None},
            'supplementalReading':REF.ranges(supplemental) if targets or free else None,
            'dayCredit':credit,'creditState':'resolved' if credit is not None else 'awaiting_policy',
            'openPolicies':list({p['policy']:p for p in policies}.values()),
            'assignmentIds':[s['id'] for s in segments],
            'historicalLevels':[{'tier':s['tier'],'label':s['tierLabel'],'colorToken':s['colorToken'],'patternToken':s['patternToken']} for s in segments],
            'sourceActs':[{'id':a['id'],'revision':a['revision']} for a in acts],
            'elapsedTime':None}
    result['inputHash']=digest({'segments':segments,'acts':acts,'travel':travel})
    return result
