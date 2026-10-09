"""Explicit recurring custom plans, distributed over remaining non-Saturday days."""
import calendar
from datetime import timedelta
from .domain import REF,DomainError,assignment,civil,digest,instant
from .policy_v2 import MECCA,mecca_day,week
from .service import fields
RULE='custom-daily-distribution-2026-10-03.v1'

def registry():
    return {'version':RULE,'authority':'founder','source':'Coordination/LAUNCH_2026-10-03.md',
            'distribution':'daily_except_saturday','midPeriodStart':'remaining_days','changes':'next_mecca_day',
            'recurrence':'selected_target_repeats_each_period','order':'canonical_quran','remainder':'earliest_days_first'}

def normalize(value):
    fields(value,['period','selections'],['verseTarget'])
    if value['period'] not in ('daily','weekly','monthly'):raise DomainError('INVALID_PERIOD','اختر يومياً أو أسبوعياً أو شهرياً.')
    selections=value['selections']
    if not isinstance(selections,list) or not 1<=len(selections)<=114:raise DomainError('INVALID_SELECTION','اختر نطاقاً واحداً على الأقل، حتى ١١٤ نطاقاً.')
    ranges=[]
    for item in selections:
        fields(item,['surahId','fromAyah','toAyah'])
        if any(type(item[k]) is not int for k in item):raise DomainError('INVALID_SELECTION','أدخل أرقام آيات صحيحة.')
        n,a,b=item['surahId'],item['fromAyah'],item['toAyah']
        if not 1<=n<=114 or not 1<=a<=b<=REF.data['verseCounts'][n-1]:raise DomainError('INVALID_SELECTION','نطاق الآيات غير صالح.')
        ranges.append({'start':f'{n}:{a}','end':f'{n}:{b}'})
    covered=REF.coverage(ranges);target=value.get('verseTarget',len(covered))
    if type(target) is not int or not 1<=target<=len(covered):raise DomainError('INVALID_TARGET','الهدف يجب ألا يتجاوز الآيات المختارة.')
    # Store the user's selection and explicit target; duplicates never inflate it.
    return {'period':value['period'],'selections':selections,'verseTarget':target}

def target_ranges(plan):
    ranges=[{'start':f"{s['surahId']}:{s['fromAyah']}",'end':f"{s['surahId']}:{s['toAyah']}"} for s in plan['selections']]
    return REF.ranges(sorted(REF.coverage(ranges))[:plan['verseTarget']])

def period_for(day,period):
    d=civil(day)
    if period=='weekly':w=week(day);return civil(w['weekStart']),civil(w['weekEnd'])
    if period=='monthly':return d.replace(day=1),d.replace(day=calendar.monthrange(d.year,d.month)[1])
    return d,d

def assigned(member,day,commitment):
    plan=commitment['customWird'];period=plan['period'];start,end=period_for(day,period)
    active=max(start,civil(mecca_day(instant(commitment['effectiveAt']))))
    days=[active+timedelta(days=i) for i in range(max(0,(end-active).days+1)) if (active+timedelta(days=i)).weekday()!=5]
    all_verses=sorted(REF.coverage(target_ranges(plan)));daily=[];d=civil(day)
    if d in days:
        q,r=divmod(len(all_verses),len(days));index=days.index(d);offset=index*q+min(index,r)
        daily=all_verses[offset:offset+q+(index<r)]
    ranges=REF.ranges(daily);a=assignment(day,'B',commitment['id'],member,MECCA)
    a.update(tier='CUSTOM',tierLabel='ورد مخصص',colorToken='level.CUSTOM',patternToken='level-pattern.CUSTOM',cadence=period,
             cycle={'id':f"custom:{commitment['id']}:{start}",'cadence':period,'start':str(start),'end':str(end)},
             ruleVersion=RULE,scheduleVersion=RULE,assignmentDay=day,programTimeZone=MECCA,
             eligibleRanges=ranges,programApplicability='connected_app',restDayPolicy={'version':RULE,'saturdayRest':True},
             status='published' if daily else 'free_day',freeDay=not bool(daily),openPolicies=[],ranges=ranges,
             components=[{'id':'CUSTOM','label':'وردك المخصص','ranges':ranges,'reportMeaning':'member_self_report'}] if daily else [])
    a.pop('id');a['id']='as_'+digest(a)[:32]
    return a
