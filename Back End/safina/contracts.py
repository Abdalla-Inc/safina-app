"""Validate the explicit JSON Schema subset used by our dependency-free contracts.

This is intentionally not a general-purpose JSON Schema implementation. Contracts
use only refs, anyOf, types, enum, properties, required, bounded arrays/numbers,
patterns and date/date-time/uuid formats. Full external validators may also be used.
"""
import json
import math
import re
from datetime import date,datetime
from uuid import UUID
from .domain import ROOT,DomainError

def validate(value,schema,document=None,path='$'):
    if document is None:document=json.loads((ROOT/'contracts/schema.json').read_text())
    if isinstance(schema,str):schema=document['$defs'][schema]
    def fail(message):raise DomainError('SCHEMA_VALIDATION',message,path=path)
    if '$ref' in schema:
        pointer=schema['$ref']
        if not pointer.startswith('#/$defs/'):raise ValueError('Only local definition references are supported')
        return validate(value,document['$defs'][pointer.split('/')[-1]],document,path)
    if 'anyOf' in schema:
        for option in schema['anyOf']:
            try:validate(value,option,document,path);return
            except DomainError:pass
        fail('Value does not match any permitted shape.')
    if 'enum' in schema and not any(type(value)==type(v) and value==v for v in schema['enum']):fail('Value is not in the permitted enumeration.')
    kind=schema.get('type')
    valid={'object':isinstance(value,dict),'array':isinstance(value,list),'string':isinstance(value,str),
           'integer':type(value) is int,'number':type(value) in (int,float) and math.isfinite(value),
           'boolean':type(value) is bool,'null':value is None}
    if kind and not valid[kind]:fail('Expected '+kind+'.')
    if isinstance(value,dict):
        props=schema.get('properties',{})
        missing=set(schema.get('required',[]))-set(value)
        if missing:fail('Missing fields: '+', '.join(sorted(missing)))
        if schema.get('additionalProperties') is False and set(value)-set(props):fail('Unknown fields: '+', '.join(sorted(set(value)-set(props))))
        for k,v in value.items():
            if k in props:validate(v,props[k],document,path+'.'+k)
    elif isinstance(value,list):
        if len(value)<schema.get('minItems',0) or len(value)>schema.get('maxItems',float('inf')):fail('Array size is outside contract limits.')
        for i,v in enumerate(value):validate(v,schema.get('items',{}),document,f'{path}[{i}]')
    elif isinstance(value,str):
        if 'pattern' in schema and not re.search(schema['pattern'],value):fail('String does not match the contract pattern.')
        if len(value)<schema.get('minLength',0) or len(value)>schema.get('maxLength',float('inf')):fail('String length is outside contract limits.')
        f=schema.get('format')
        try:
            if f=='date':date.fromisoformat(value)
            elif f=='date-time':
                if datetime.fromisoformat(value.replace('Z','+00:00')).tzinfo is None:raise ValueError()
            elif f=='uuid':UUID(value)
        except ValueError:fail('Invalid '+f+' format.')
    elif type(value) in (int,float):
        if value<schema.get('minimum',-float('inf')) or value>schema.get('maximum',float('inf')):fail('Number is outside contract limits.')
