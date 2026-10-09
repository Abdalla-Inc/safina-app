"""Owner-only presentation simulation and persistent custom commitment workflows."""
import json
from datetime import timedelta
from uuid import uuid4
from .domain import REF,TIERS,DomainError,canonical,civil,coverage_of,instant
from .policy_v2 import RULE as STANDARD_RULE,mecca_day
from .custom_plans import RULE,normalize,target_ranges,period_for
from .service import fields,act_day

class Launch:
    def require_founder(self,member):
        if self.account(member)['role']!='founder':raise DomainError('FORBIDDEN','هذه الأدوات لمالك التطبيق فقط.',403)
    def admin_ship_preview(self,member):
        self.require_founder(member)
        row=self.store.db.execute('SELECT payload FROM admin_ship_previews WHERE member_id=?',(member,)).fetchone()
        return json.loads(row['payload']) if row else dict(revision=0,enabled=False,buildStep=0,health=100,celebration=False)
    def admin_ship_preview_put(self,member,body,remove=False):
        old=self.admin_ship_preview(member)
        fields(body,['mutationId','expectedRevision']+([] if remove else ['buildStep','health','celebration']))
        if type(body['expectedRevision']) is not int or body['expectedRevision']!=old['revision']:raise DomainError('REVISION_CONFLICT','تغيّرت إعدادات العرض. حدّث الصفحة.',409,current=old)
        if not remove and (type(body['buildStep']) is not int or not 0<=body['buildStep']<=30 or type(body['health']) is not int or not 0<=body['health']<=100 or type(body['celebration']) is not bool):raise DomainError('INVALID_PREVIEW','راجع مرحلة البناء والصحة.')
        result={**old,'revision':old['revision']+1,'enabled':not remove}
        if not remove:result.update({k:body[k] for k in ('buildStep','health','celebration')})
        self.store.db.execute('INSERT INTO admin_ship_previews VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',(member,result['revision'],canonical(result)))
        return result
    def custom_wird_put(self,member,body):
        fields(body,['mutationId','expectedCommitmentId','customWird'])
        plan=normalize(body['customWird']);state=self.state(member);old=self._commitment_at(state,self.now())
        return self._queue_plan(member,state,old,body['expectedCommitmentId'],'CUSTOM',RULE,plan)
    def _queue_plan(self,member,state,old,expected,tier,rule,plan=None):
        if old['id']!=expected:raise DomainError('COMMITMENT_CONFLICT','تغيّر الورد. حدّث الصفحة.',409)
        if any(instant(c['effectiveAt'])>self.now() for c in state['commitments']):raise DomainError('CHANGE_ALREADY_QUEUED','يوجد تغيير يبدأ غداً.',409)
        effective=(civil(mecca_day(self.now()))+timedelta(days=1)).isoformat()+'T00:00:00+03:00'
        c=dict(id=str(uuid4()),tier=tier,effectiveAt=instant(effective).isoformat(),timezone='Asia/Riyadh',initial=False,ruleVersion=rule)
        if plan:c['customWird']=plan
        self.store.event(member,'CommitmentSet',c['id'],c,self.timestamp());self.store.record('Commitment',c['id'],member,c)
        return self.commitment(member)
    def _change(self,member,body,state):
        old=self._commitment_at(state,self.now())
        if old.get('ruleVersion')!=RULE:return super()._change(member,body,state)
        fields(body,['mutationId','tier','expectedCommitmentId','ruleVersion'])
        if body['ruleVersion']!=RULE:raise DomainError('INCOMPATIBLE_SNAPSHOT','حدّث الورد أولاً.',409)
        if body['tier'] not in TIERS:raise DomainError('INVALID_TIER','اختر مستوى صالحاً.')
        self._queue_plan(member,state,old,body['expectedCommitmentId'],body['tier'],STANDARD_RULE)
        return {'change':self.state(member)['commitments'][-1]}
    def custom_wird_today(self,member,assignment):
        state=self.state(member);c=next(c for c in state['commitments'] if c['id']==assignment['commitmentId'])
        if c.get('ruleVersion')!=RULE:return None
        plan=c['customWird'];start,end=period_for(assignment['date'],plan['period']);target=REF.coverage(target_ranges(plan))
        # Progress counts the assigned portion of each day, preventing future portions
        # read early from silently completing a different day's commitment.
        actual=set()
        for act in self._active(state):
            day=act_day(act)
            if str(start)<=day<=str(end):
                for snap in self._segments(member,day,state):
                    if snap['commitmentId']==c['id']:actual.update(REF.coverage(act['ranges']) & REF.coverage(snap['ranges']))
        daily=REF.coverage(assignment['ranges']);today=coverage_of(self._active(state,assignment['date']))
        return dict(period=plan['period'],periodStart=str(start),periodEnd=str(end),ranges=target_ranges(plan),targetVerseCount=len(target),coveredVerseCount=len(actual & target),complete=target<=actual,dailyTargetVerseCount=len(daily),dailyCoveredVerseCount=len(daily & today),distribution='daily_except_saturday')
    def ship_visual(self,member):
        from uuid import uuid5,NAMESPACE_URL
        from .domain import digest
        self.account(member);state=self.state(member);days=[];proofs=[]
        for day in sorted({act_day(a) for a in state['acts'].values()}):
            segments=self._segments(member,day,state)
            if not segments or any(a['ruleVersion'] not in (STANDARD_RULE,RULE) for a in segments):continue
            ev=self.day(member,day,state)
            if ev['dayCredit']==1 and ev['status']=='completed' and civil(day).weekday()!=5:
                days.append(day);proofs.append(ev['inputHash'])
        step=min(30,len(days));current=self._commitment_at(state,self.now())
        legacy=current.get('ruleVersion') not in (STANDARD_RULE,RULE)
        pending=legacy or step==30
        blocked=['existing_member_activation'] if legacy else (['rest_day_settlement','zero_health_recovery','repair_timing','post_construction_correction'] if pending else [])
        value=dict(schemaVersion='1.0.0-proposed',assetVersion='0.5.0',vesselId=str(uuid5(NAMESPACE_URL,'safina-vessel:'+member)),
                   lifecyclePolicyId='founder-ship-lifecycle-2026-10-01.v1',status='awaiting_policy' if pending else 'ready',
                   state=None if pending else dict(phase='construction',buildStep=step,health=100,maintenanceTimezone='Asia/Riyadh',lastSettledMaintenanceDate=None,nextSettlementAt=None),
                   blockedReasons=blocked,earnedBuildStep=step)
        fingerprint=digest([value,days,proofs]);row=self.store.db.execute('SELECT * FROM vessel_projections WHERE member_id=?',(member,)).fetchone()
        revision=row['revision'] if row else 0
        if not row or row['input_hash']!=fingerprint:
            revision+=1
            self.store.db.execute('INSERT INTO vessel_projections VALUES(?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET revision=excluded.revision,input_hash=excluded.input_hash,payload=excluded.payload',(member,revision,fingerprint,canonical(value)))
        return {**value,'revision':revision,'generatedAt':self.timestamp()}
