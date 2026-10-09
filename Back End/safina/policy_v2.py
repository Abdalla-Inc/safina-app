"""Latest founder policy, opt-in through an explicit commitment rule version."""
from datetime import datetime,time,timedelta,timezone
from .domain import (REF,RULE_VERSION as LEGACY_RULE,assignment,civil,digest,zone)
RULE='founder-community-2026-09-29.v2'
MECCA='Asia/Riyadh'
SOURCE='docs/FRONTEND_DELIVERY_BRIEF_2026-09-29.md'

def mecca_day(at):return at.astimezone(zone(MECCA)).date().isoformat()
def week(day):
    d=civil(day);start=d-timedelta(days=(d.weekday()+1)%7);end=start+timedelta(days=6)
    utc=lambda d:datetime.combine(d,time.min,zone(MECCA)).astimezone(timezone.utc).isoformat()
    return {'weekStart':start.isoformat(),'weekEnd':end.isoformat(),'timeZone':MECCA,
            'startAt':utc(start),'endExclusive':utc(end+timedelta(days=1)),'celebrationStartsAt':utc(end)}
def week_status(period,now):
    w=week(period)
    from .domain import instant
    return 'archived' if now>=instant(w['endExclusive']) else ('celebrating' if now>=instant(w['celebrationStartsAt']) else 'in_progress')
def registry():
    return {'version':RULE,'authority':'founder','source':SOURCE,'scope':'New connected commitments; legacy snapshots retain v1.',
            'rules':[{'id':'mecca_program_day','status':'confirmed','text':'Connected program assignments and community days use Asia/Riyadh.'},
                     {'id':'saturday_rest','status':'confirmed','text':'All seven tiers have no required new work on Saturday. Voluntary reports award no Saturday day credit.'},
                     {'id':'automatic_community','status':'confirmed','text':'After acknowledged community scope, eligible confirmed assigned reading updates daily/weekly projections automatically. Visibility remains revocable.'},
                     {'id':'partial_weekly','status':'confirmed','text':'Any positive eligible reading participates in the weekly summary. Khatma proof and partial reward are distinct.'},
                     {'id':'course_prerequisites','status':'confirmed','text':'All preceding required lessons and submitted required answers must be complete; no score or religious grading is invented.'}],
            'inheritedUnresolved':['february_grid','monthly_continuation','weekly_day_credit','same_day_credit','cross_cadence','partial_credit','ship_carry','repeat_khatma','quran_assets']}

def assigned(day,tier,commitment,member,tz=MECCA):
    a=assignment(day,tier,commitment,member,tz)
    # Eligibility is distinct from new required work, including Saturday catch-up.
    original=REF.coverage(a['ranges'])
    eligible=REF.all if tier in ('BJ4','BJ5') else (original or (REF.bi if tier=='BI' else REF.b))
    a.update(ruleVersion=RULE,scheduleVersion=RULE+':confirmed-templates',assignmentDay=day,
             programTimeZone=MECCA,eligibleRanges=REF.ranges(eligible),programApplicability='connected_app',
             restDayPolicy={'version':RULE,'saturdayRest':True})
    if civil(day).weekday()==5:
        a.update(status='free_day',freeDay=True,ranges=[],components=[],openPolicies=[])
    for p in a['openPolicies']:p['ruleVersion']=RULE
    a.pop('id',None);a['id']='as_'+digest(a)[:32]
    return a
