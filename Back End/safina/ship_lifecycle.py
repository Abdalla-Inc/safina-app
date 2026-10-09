"""Confirmed maintenance arithmetic only. Activation/eligibility remain policy-gated.

Always replay from the audited opening health, never yesterday's already settled result.
The API deliberately does not call this until calendar and migration rules are approved.
"""
from .domain import DomainError,civil

def replay_maintenance(initial_health,days):
    if type(initial_health) is not int or not 0<=initial_health<=100:raise DomainError('INVALID_HEALTH','Health must be an integer from 0 to 100.')
    if not isinstance(days,list):raise DomainError('INVALID_SETTLEMENT','Expected ordered closed days.')
    health=initial_health;previous='';ledger=[]
    for day in days:
        if not isinstance(day,dict):raise DomainError('INVALID_SETTLEMENT','Expected a day object.')
        civil(day.get('date'))
        if day['date']<=previous or day.get('closed') is not True or day.get('outcome') not in ('completed','missed','exempt'):raise DomainError('UNRESOLVED_SETTLEMENT','Days must be closed, unique, chronological and have approved outcomes.',409)
        delta={'completed':3,'missed':-3,'exempt':0}[day['outcome']];before=health;health=max(0,min(100,health+delta))
        ledger.append({'date':day['date'],'outcome':day['outcome'],'before':before,'requestedDelta':delta,'appliedDelta':health-before,'after':health});previous=day['date']
    return {'health':health,'ledger':ledger}
