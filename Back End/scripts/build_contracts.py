"""Publish explicit OpenAPI 3.1 / JSON Schema contracts, independent of the UI."""
import json
from safina.domain import ROOT,TIERS
from safina.modules import DRAFT_FIELDS
S={'type':'string'};N={'type':'integer','minimum':0};BOOL={'type':'boolean'};DATE={'type':'string','format':'date'};UUID={'type':'string','format':'uuid'}
def ref(name):return {'$ref':'#/$defs/'+name}
def arr(item):return {'type':'array','items':item}
def obj(props,required=None,extra=False):return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':extra}
def nullable(schema):return {'anyOf':[schema,{'type':'null'}]}
def enum(*values):return {'enum':list(values)}
D={}
D['Range']=obj({'start':{'type':'string','pattern':r'^\d{1,3}:\d{1,3}$'},'end':{'type':'string','pattern':r'^\d{1,3}:\d{1,3}$'}})
R=arr(ref('Range'))
D['OpenPolicy']=obj({'code':enum('RULE_NOT_APPROVED','SCHEDULE_NOT_PUBLISHED'),'policy':S,'question':S,'ruleVersion':S})
P=arr(ref('OpenPolicy'))
D['Cycle']=obj({'id':S,'cadence':enum('monthly','weekly'),'start':DATE,'end':DATE})
D['Commitment']=obj({'id':UUID,'tier':enum(*TIERS),'effectiveAt':{'type':'string','format':'date-time'},'timezone':S,'initial':BOOL,'previousId':UUID,'requestedAt':S},['id','tier','effectiveAt','timezone','initial'])
D['AssignmentSnapshot']=obj({'id':S,'memberId':S,'date':DATE,'tier':enum(*TIERS),'tierLabel':S,'colorToken':S,'patternToken':S,'cadence':enum('daily','monthly','weekly'),'cycle':ref('Cycle'),'timezone':S,'commitmentId':UUID,'ruleVersion':S,'referenceVersion':S,'scheduleVersion':S,'status':enum('published','free_day','awaiting_policy'),'freeDay':BOOL,'components':arr(obj({'id':S,'label':S,'ranges':R,'reportMeaning':enum('member_self_report')})),'ranges':R,'openPolicies':P})
D['AssignmentSegment']=obj({'assignmentId':S,'commitmentId':UUID,'date':DATE,'effectiveAt':S})
D['HistoricalLevel']=obj({'tier':enum(*TIERS),'label':S,'colorToken':S,'patternToken':S})
D['ActRevisionKey']=obj({'id':UUID,'revision':{'type':'integer','minimum':1}})
D['ReaderTrace']=obj({'id':UUID,'memberId':S,'revision':{'type':'integer','minimum':1},'occurrenceDate':DATE,'occurredAt':S,'timezone':S,'utcOffsetMinutes':{'type':'integer'},'referenceVersion':S,'observations':arr(obj({'kind':enum('exposed','navigated','page_opened','audio_played'),'ranges':R})),'suggestedRanges':R,'state':enum('reader_suggestion'),'discarded':BOOL,'updatedAt':S,'createdAt':S,'credit':enum(0),'explanation':S})
D['ReadingAct']=obj({'id':UUID,'memberId':S,'revision':{'type':'integer','minimum':1},'revisionOf':nullable(N),'retracted':BOOL,'occurrenceDate':DATE,'occurredAt':S,'timezone':S,'utcOffsetMinutes':{'type':'integer'},'source':enum('manual','manual_physical','reader_confirmed','component_self_report'),'assignmentId':S,'ruleVersion':S,'referenceVersion':S,'ranges':R,'repeatOfActId':nullable(UUID),'traceId':nullable(UUID),'cycleId':S,'freeDay':BOOL,'createdAt':S,'updatedAt':S,'mutationId':UUID,'confirmationState':enum('member_confirmed'),'revisionReason':S},required=['id','memberId','revision','revisionOf','retracted','occurrenceDate','occurredAt','timezone','utcOffsetMinutes','source','assignmentId','ruleVersion','referenceVersion','ranges','repeatOfActId','traceId','cycleId','freeDay','createdAt','updatedAt','mutationId','confirmationState'])
D['ReadingRevision']=ref('ReadingAct')
D['DayEvaluation']=obj({'date':DATE,'status':enum('completed','partial','supplemental_only','no_entry','free_day','recorded_awaiting_policy','paused'),'actualReadingStatus':enum('member_confirmed','no_entry'),'uniqueCoverage':R,'uniqueVerseCount':N,'repeatedActs':arr(UUID),'assignedFulfilment':obj({'ranges':R,'matchedVerses':N,'targetVerses':N,'complete':nullable(BOOL)}),'supplementalReading':nullable(R),'dayCredit':enum(0,1,None),'creditState':enum('resolved','awaiting_policy'),'openPolicies':P,'assignmentIds':arr(S),'historicalLevels':arr(ref('HistoricalLevel')),'sourceActs':arr(ref('ActRevisionKey')),'elapsedTime':{'type':'null'},'inputHash':S,'corrected':BOOL,'readerObservedTrace':arr(ref('ReaderTrace'))})
D['KhatmaRecord']=obj({**D['Cycle']['properties'],'status':enum('complete','incomplete','awaiting_policy'),'uniqueCoverage':R,'coveredVerses':N,'totalVerses':enum(6236),'remainingRanges':R,'nextUnreadVerse':nullable(S),'completedJuz':arr({'type':'integer','minimum':1,'maximum':30}),'proofHash':nullable(S),'completionDate':nullable(DATE),'ordinal':enum(1,None),'sourceActRevisions':arr(ref('ActRevisionKey')),'additionalKhatmas':obj({'status':enum('awaiting_policy'),'policy':ref('OpenPolicy')}),'excludedFreeDayActs':arr(UUID),'openPolicies':P})
D['Khatmas']=obj({'visibility':enum('private'),'referenceVersion':S,'cycles':arr(ref('KhatmaRecord'))})
D['ShipProgress']=obj({'visibility':enum('private'),'approvedCredits':N,'creditsPerShip':enum(30),'periods':arr(obj({'month':S,'approvedCredits':N,'completedShipsWithinPeriod':N})),'completedShipsWithinPeriods':N,'currentShip':{'type':'null'},'lifetimeShipCount':{'type':'null'},'presentationStatus':enum('awaiting_policy'),'openPolicies':P,'unresolvedDayCredits':arr(DATE),'ledger':arr(obj({'date':DATE,'credit':enum(0,1,None),'inputHash':S}))})
D['ShipLedger']=ref('ShipProgress')
D['CalendarDay']=obj({**D['DayEvaluation']['properties'],'khatmaMarks':arr(S)})
D['Calendar']=obj({'visibility':enum('private'),'days':arr(ref('CalendarDay'))})
D['Provenance']=obj({'primary':S,'primaryVersion':S,'primaryLicenseDeclared':S,'primaryCopyright':S,'primarySha256':S,'crossCheck':S,'crossCheckSha256':S,'checkedAt':DATE,'matchingSurahs':enum(114),'matchingJuz':enum(30),'matchingPages':enum(604),'independenceLimit':S,'textAvailable':enum(False),'wordMapAvailable':enum(False)})
D['Today']=obj({'assignment':ref('AssignmentSnapshot'),'segments':arr(ref('AssignmentSnapshot')),'evaluation':ref('DayEvaluation'),'khatmaCoverage':ref('KhatmaRecord'),'nextUnreadVerse':nullable(S),'dataProvenance':ref('Provenance'),'queuedChanges':arr(ref('Commitment')),'readerText':obj({'status':enum('unavailable'),'openPolicy':ref('OpenPolicy')})})
D['ReadingMutationResult']=obj({'act':ref('ReadingAct'),'evaluation':ref('DayEvaluation'),'shipProgress':ref('ShipProgress'),'explanation':S},['act','evaluation','shipProgress'])
D['TraceResult']=obj({'trace':ref('ReaderTrace'),'confirmedActIds':arr(UUID)},['trace'])
D['ProgramRule']=obj({'id':S,'status':enum('confirmed','proposed','open','superseded'),'text':S,'question':S,'source':S,'sourceVersion':S,'supersededBy':S},['id','status','source','sourceVersion'])
D['RuleRegistry']=obj({'version':S,'authority':enum('founder'),'evidence':S,'rules':arr(ref('ProgramRule'))})
D['MushafPageMap']=obj({'edition':S,'version':S,'starts':arr(S)})
D['QuranReferenceVersion']=obj({'version':S,'verseCounts':arr(N),'juzStarts':arr(S),'pageMap':ref('MushafPageMap'),'provenance':ref('Provenance')})
D['OfflineSnapshot']=obj({'payload':obj({'version':enum(1),'memberId':S,'assignment':ref('AssignmentSnapshot'),'reference':ref('QuranReferenceVersion'),'rules':ref('RuleRegistry')}),'algorithm':enum('HMAC-SHA256'),'signature':S,'verification':S})
D['Page']=obj({'edition':S,'mapVersion':S,'page':N,'referenceVersion':S,'ranges':R})
D['Error']=obj({'error':obj({'code':S,'message':S,'policy':S,'question':S,'ruleVersion':S},['code','message'],True)})
D['ReadingCreate']=obj({'mutationId':UUID,'logicalActId':UUID,'occurrenceDate':DATE,'occurredAt':{'type':'string','format':'date-time'},'timezone':S,'utcOffsetMinutes':{'type':'integer','minimum':-840,'maximum':840},'ranges':{**R,'minItems':1,'maxItems':200},'source':enum('manual','manual_physical','reader_confirmed','component_self_report'),'assignmentId':S,'ruleVersion':S,'referenceVersion':S,'repeatOfActId':UUID,'traceId':UUID,'componentId':S},['mutationId','logicalActId','occurrenceDate','occurredAt','timezone','utcOffsetMinutes','ranges','source','assignmentId','ruleVersion','referenceVersion'])
D['ReadingPatch']=obj({'mutationId':UUID,'expectedRevision':{'type':'integer','minimum':1},'reason':S,'ranges':{**R,'minItems':1},'ruleVersion':S,'referenceVersion':S})
D['Retract']=obj({'mutationId':UUID,'expectedRevision':{'type':'integer','minimum':1},'reason':S})
D['CommitmentChangeRequest']=obj({'mutationId':UUID,'tier':enum(*TIERS),'expectedCommitmentId':UUID,'ruleVersion':S})
D['CommitmentChange']=obj({'change':ref('Commitment'),'creditPolicy':ref('OpenPolicy')})
D['TracePut']=obj({'mutationId':UUID,'expectedRevision':N,'occurrenceDate':DATE,'occurredAt':S,'timezone':S,'utcOffsetMinutes':{'type':'integer'},'observations':arr(obj({'kind':enum('exposed','navigated','page_opened','audio_played'),'ranges':R})),'referenceVersion':S})
D['TraceDiscard']=obj({'mutationId':UUID,'expectedRevision':{'type':'integer','minimum':1}})
D['MonthlySchedule']=obj({'id':S,'ruleVersion':S,'referenceVersion':S,'date':DATE,'tier':enum(*TIERS),'ranges':R,'status':enum('published','free_day','awaiting_policy'),'approvalSource':S,'openPolicies':P})
D['WeeklyCycle']=ref('Cycle')
D['ReminderPreference']=obj({'enabled':BOOL,'localTime':S,'timezone':S,'deliveryStatus':enum('not_implemented'),'revision':N,'mutationId':UUID},['enabled','deliveryStatus'])
D['ReminderPut']=obj({'mutationId':UUID,'enabled':BOOL,'localTime':S,'timezone':S})
D['DhikrGoalRequest']=obj({'mutationId':UUID,'id':UUID,'expectedRevision':N,'label':S,'target':N})
D['DhikrCountRequest']=obj({'mutationId':UUID,'id':UUID,'expectedRevision':N,'goalId':UUID,'date':DATE,'count':N})
D['DhikrGoal']=obj({'id':UUID,'label':S,'target':N,'revision':N,'memberId':S,'updatedAt':S,'readingCredit':enum(0)})
D['DhikrCount']=obj({'id':UUID,'goalId':UUID,'date':DATE,'count':N,'revision':N,'memberId':S,'updatedAt':S,'readingCredit':enum(0)})
D['Dhikr']=obj({'goals':arr(ref('DhikrGoal')),'counts':arr(ref('DhikrCount')),'readingCredit':enum(0)})
D['DhikrResult']=obj({'record':{'anyOf':[ref('DhikrGoal'),ref('DhikrCount')]}})
D['Entitlements']=obj({'freeCapabilities':arr(S),'ads':enum(False),'paidCapabilities':{'type':'null'},'status':enum('awaiting_policy'),'price':{'type':'null'}})
D['VerifiedSnapshot']=obj({'valid':enum(True),'assignmentId':S})
D['ActHistory']=obj({'act':ref('ReadingAct'),'revisions':arr(ref('ReadingAct'))})
D['Event']=obj({'sequence':N,'id':UUID,'member_id':S,'kind':S,'entity_id':S,'payload':{'type':'object'},'created_at':S})
D['Events']=obj({'events':arr(ref('Event')),'visibility':enum('private')})
# Draft contracts carry relationships explicitly; these types do not authorize publication.
for kind,names in DRAFT_FIELDS.items():
    props={n:nullable(S) for n in names}
    for n in ('weeks','week','sequence','positionSeconds'):
        if n in props:props[n]=N
    for n in ('prerequisiteIds','completedComponents','tags','questions','ranges'):
        if n in props:props[n]=arr(S) if n!='ranges' else R
    for n in ('chatEnabled','enabled'):
        if n in props:props[n]=BOOL
    if kind=='ClassroomCourse':props['weeks']=enum(10)
    if kind=='ClassroomLesson':props['week']={'type':'integer','minimum':1,'maximum':10};props['sourceVideo']=obj({'url':S,'provider':S,'rightsReviewId':nullable(S)})
    if kind=='Quiz':props['questions']=arr(obj({'id':S,'kind':enum('multiple_choice','written_response'),'prompt':S,'options':arr(obj({'id':S,'text':S})),'answerKey':nullable(arr(S))}))
    if kind=='MediaResource':
        props['rights']=obj({n:enum('unreviewed','permitted','denied') for n in ('host','embed','transcribe','redistribute')})
        props['provenance']=obj({'provider':S,'sourceId':S,'retrievedAt':nullable(S)})
        props['transcript']=nullable(obj({'version':S,'language':S,'segments':arr(obj({'startSeconds':N,'text':S}))}))
        props['review']=obj({'reviewerId':nullable(S),'reviewedAt':nullable(S),'transcriptVersion':nullable(S)})
    D[kind+'DraftInput']=obj(props)
    D[kind+'Draft']=obj({'id':S,'revision':{'type':'integer','minimum':1},'status':enum('draft'),'publicationStatus':enum('blocked'),'data':ref(kind+'DraftInput')})
    if kind not in D:D[kind]=ref(kind+'Draft')
schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://safina.local/contracts/0.3.0/schema.json','$defs':D}
(ROOT/'contracts/schema.json').write_text(json.dumps(schema,indent=2)+'\n')
paths={}
def endpoint(path,method,response,request=None,query=(),description=''):
    parameters=[]
    for part in path.split('/'):
        if part.startswith('{'):parameters.append({'name':part[1:-1],'in':'path','required':True,'schema':S})
    for name,required in query:parameters.append({'name':name,'in':'query','required':required,'schema':S})
    op={'operationId':method+'_'+path.strip('/').replace('/','_').replace('{','').replace('}','').replace('-','_'),
        'summary':description or path,'security':[{'memberBearer':[]}],'parameters':parameters,
        'responses':{'200':{'description':'Member-scoped response. Null credit is unresolved, never zero.','content':{'application/json':{'schema':{'$ref':'./schema.json#/$defs/'+response}}}},
                     'default':{'description':'Structured error: auth, validation, conflict, policy gate or unavailable service.','content':{'application/json':{'schema':{'$ref':'./schema.json#/$defs/Error'}}}}},
        'x-permissions':'Authenticated member owns every returned or mutated private record.',
        'x-offline':'Cache immutable snapshots privately; provisional entries sync to server. No client-awarded credit.',
        'x-idempotency':'Mutation UUID returns original receipt; reused UUID/different body conflicts.' if request and request!='OfflineSnapshot' else 'Read-only; response reflects current server ledger.'}
    if request:op['requestBody']={'required':True,'content':{'application/json':{'schema':{'$ref':'./schema.json#/$defs/'+request}}}}
    paths.setdefault(path,{})[method]=op
endpoint('/program-rules','get','RuleRegistry')
endpoint('/today','get','Today',query=[('date',False)])
endpoint('/calendar','get','Calendar',query=[('start',True),('end',True)])
endpoint('/day-evaluation','get','DayEvaluation',query=[('date',True)])
endpoint('/ship-progress','get','ShipProgress');endpoint('/khatmas','get','Khatmas')
endpoint('/reading-acts','post','ReadingMutationResult','ReadingCreate')
endpoint('/reading-acts/{id}','get','ActHistory');endpoint('/reading-acts/{id}','patch','ReadingMutationResult','ReadingPatch')
endpoint('/reading-acts/{id}/retract','post','ReadingMutationResult','Retract')
endpoint('/commitment-changes','post','CommitmentChange','CommitmentChangeRequest')
endpoint('/reading-sessions/{id}/trace','get','TraceResult');endpoint('/reading-sessions/{id}/trace','put','TraceResult','TracePut')
endpoint('/reading-sessions/{id}/discard','post','TraceResult','TraceDiscard')
endpoint('/offline-snapshot','get','OfflineSnapshot',query=[('date',True)])
endpoint('/offline-snapshot/verify','post','VerifiedSnapshot','OfflineSnapshot')
endpoint('/quran/reference','get','QuranReferenceVersion');endpoint('/quran/page','get','Page',query=[('edition',True),('mapVersion',True),('page',True)])
endpoint('/dhikr','get','Dhikr');endpoint('/dhikr/goals','post','DhikrResult','DhikrGoalRequest');endpoint('/dhikr/counts','post','DhikrResult','DhikrCountRequest')
endpoint('/reminder-preference','get','ReminderPreference');endpoint('/reminder-preference','put','ReminderPreference','ReminderPut')
endpoint('/events','get','Events');endpoint('/entitlements','get','Entitlements')
for path,method,policy in [('/groups','get','group_policy'),('/groups/publications','post','group_policy'),('/groups/consents','post','group_policy'),('/groups/memberships','post','group_policy'),('/pauses','post','pause_travel'),('/classroom','get','classroom_policy'),('/classroom/grade','post','classroom_policy'),('/library/search','get','library_rights'),('/quran/text','get','quran_assets')]:
    paths[path]={method:{'summary':'Blocked until founder-approved policy: '+policy,'security':[{'memberBearer':[]}],'responses':{'409':{'description':'RULE_NOT_APPROVED; no mutation or publication occurs.','content':{'application/json':{'schema':{'$ref':'./schema.json#/$defs/Error'}}}}},'x-policy-gate':policy}}
paths['/health']={'get':{'summary':'Local process health; no member data','security':[],'responses':{'200':{'description':'Local service is running.'}}}}
for path,methods in paths.items():
    for method,operation in methods.items():
        if method=='post' and operation.get('x-policy-gate'):
            operation['requestBody']={'required':True,'content':{'application/json':{'schema':{'type':'object'}}}}
openapi={'openapi':'3.1.0','info':{'title':'Safinat Al-Nur local backend','version':'0.3.0','description':'Confirmed core and explicit unresolved states. Local integration only.'},'servers':[{'url':'http://127.0.0.1:8765'}],'components':{'securitySchemes':{'memberBearer':{'type':'http','scheme':'bearer'}}},'paths':paths}
(ROOT/'contracts/openapi.json').write_text(json.dumps(openapi,indent=2)+'\n')
print(f'Wrote {len(D)} named JSON schemas and {sum(len(v) for v in paths.values())} HTTP operation contracts.')
