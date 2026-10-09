"""Versioned connected contract. v0.3 definitions/files remain available unchanged."""
import copy,json,re
from safina.domain import ROOT
S={'type':'string'};B={'type':'boolean'};I={'type':'integer','minimum':0};N={'type':'number','minimum':0};D={'type':'string','format':'date'};U={'type':'string','format':'uuid'}
def ref(n):return {'$ref':'#/$defs/'+n}
def arr(x):return {'type':'array','items':x}
def null(x):return {'anyOf':[x,{'type':'null'}]}
def obj(p,optional=()):return {'type':'object','properties':p,'required':[k for k in p if k not in optional],'additionalProperties':False}
def extend(schema,props,optional=()):
    schema['properties'].update(props);schema['required']+= [k for k in props if k not in optional];return schema

def build():
    defs=copy.deepcopy(json.loads((ROOT/'contracts/schema.json').read_text())['$defs'])
    ranges=arr(ref('Range'));mid={'mutationId':U};rev={**mid,'expectedRevision':I}
    extend(defs['Commitment'],{'ruleVersion':S},['ruleVersion'])
    extend(defs['AssignmentSnapshot'],{'assignmentDay':D,'programTimeZone':S,'eligibleRanges':ranges,'programApplicability':S,'restDayPolicy':obj({'version':S,'saturdayRest':B})})
    extend(defs['ReadingAct'],{'assignmentDay':D,'communityDay':D,'componentId':S},['assignmentDay','communityDay','componentId'])
    # ReadingRevision is already a reference to ReadingAct in the legacy document.
    if 'properties' in defs['ReadingRevision']:extend(defs['ReadingRevision'],{'assignmentDay':D,'communityDay':D,'componentId':S},['assignmentDay','communityDay','componentId'])
    extend(defs['Today'],{'componentStates':arr(obj({'id':S,'label':S,'ranges':ranges,'status':{'enum':['completed','partial','no_entry']},'coveredRanges':ranges,'coveredVerseCount':I,'targetVerseCount':I})), 'serverTime':S,'assignmentDay':D,'communityDay':D,'projectionRevision':I})
    occurrence={'occurredAt':S,'occurrenceDate':D,'timezone':S,'utcOffsetMinutes':{'type':'integer'}}
    defs.update({
      'Session':obj({'memberId':S,'csrfToken':S,'expiresAt':S,'mode':{'enum':['sandbox','supabase']}}),
      'Register':obj({'email':S,'password':{'type':'string','minLength':12,'maxLength':256},'displayName':{'type':'string','minLength':1,'maxLength':80},'tier':{'enum':['B','BI','BJ1','BJ2','BJ3','BJ4','BJ5']},'communityAcknowledged':{'enum':[True]}}),
      'Login':obj({'email':S,'password':S}),'Verify':obj({'email':S,'code':S}),'Recover':obj({'email':S}),'Reset':obj({'email':S,'code':S,'password':S}),
      'GoogleStart':obj({'displayName':S,'tier':S,'communityAcknowledged':B},['displayName','tier','communityAcknowledged']),
      'AuthState':obj({'state':S,'message':S,'delivery':S},['delivery','message']),
      'EmptyBody':obj({}),'Redirect':obj({'url':S}),
      'ProfilePatch':obj({**rev,'displayName':{'type':'string','minLength':1,'maxLength':80},'locale':{'enum':['ar','en']},'largeText':B,'reducedMotion':B,'communityVisible':B},['displayName','locale','largeText','reducedMotion','communityVisible']),
      'AvatarPut':obj({**rev,'dataBase64':S}),'RevisionMutation':obj(rev),
      'ComponentPut':obj({**mid,'assignmentId':S,'expectedInputHash':S,'completed':B,**occurrence},list(occurrence)),
      'PartialPost':obj({**mid,'assignmentId':S,'expectedInputHash':S,'ranges':ranges,**occurrence}),
      'ReadingResult':obj({'today':ref('Today'),'shipProgress':ref('ShipProgress'),'projectionRevision':I,'unchanged':B},['shipProgress','unchanged']),
      'Reader':obj({'edition':S,'mapVersion':S,'page':{'type':'integer','minimum':1,'maximum':604},'bookmarks':arr({'type':'integer','minimum':1,'maximum':604}),'revision':I}),
      'ReaderPut':obj({**rev,'edition':S,'mapVersion':S,'page':{'type':'integer','minimum':1,'maximum':604},'bookmarks':arr({'type':'integer','minimum':1,'maximum':604})}),
      'ReactionPut':obj({**mid,'reacted':B,'expectedRevision':I},['expectedRevision']),
      'Reaction':obj({'id':S,'heartCount':I,'viewerReacted':B,'reactionRevision':I}),
      'ReportPost':obj({**mid,'targetId':S,'reason':S}), 'ModerationPost':obj({**mid,'targetId':S,'reason':S,'action':{'enum':['hide','restore']}}),
      'DeletionPost':obj({**mid,'confirmation':{'enum':['DELETE']}}),
      'ProgressPut':obj({**rev,'courseVersion':I,'positionSeconds':N,'completed':B}),
      'NotePut':obj({**rev,'courseVersion':I,'body':{'type':'string','maxLength':20000}}),
      'BookmarkPut':obj({**rev,'courseVersion':I,'saved':B}),
      'AnswersPut':obj({**rev,'courseVersion':I,'answers':{'type':'object','additionalProperties':{'type':'string','maxLength':20000}}}),
    })
    history=copy.deepcopy(defs['Commitment']);extend(history,{'effectiveTo':null(S),'status':S,'colorToken':S})
    defs['CommitmentView']=obj({'effective':ref('Commitment'),'pending':arr(history),'history':arr(history),'availableTiers':arr(S),'allowedTransitions':obj({'nonweekly':S,'weekly':S,'crossCadence':S})})
    defs['Me']=obj({'id':S,'displayName':S,'avatarId':null(S),'avatarVersion':I,'avatarUrl':null(S),'locale':S,'reducedMotion':B,'largeText':B,'communityVisible':B,'communityAcknowledgedAt':S,'communityScopeVersion':S,'revision':I,'status':S,'timezone':S,'email':S,'permissions':obj({'founder':B,'moderate':B}),'commitment':ref('CommitmentView'),'featureFlags':obj({'automaticCommunity':B,'learning':B,'readerPassiveCredit':B}),'communityScope':obj({'version':S,'description':S})})
    week={'weekStart':D,'weekEnd':D,'timeZone':S,'startAt':S,'endExclusive':S,'celebrationStartsAt':S}
    defs['Context']=obj({'serverTime':S,'day':D,**week,'status':S,'communityId':S,'nextDayRollover':S,'nextWeekRollover':S,'restDay':B,'restDayPolicy':obj({'version':S,'appliesTo':arr(S)}),'ayah':obj({'status':S,'references':arr(S),'text':null(S),'textVersion':null(S)}),'projectionRevision':I})
    member=obj({'id':S,'displayName':S,'avatarUrl':null(S),'avatarVersion':I})
    presentation={'id':S,'member':member,'revision':I,'projectionState':S,'sourceSequence':I,'heartCount':I,'viewerReacted':B,'reactionRevision':I,'visibility':S}
    comp=copy.deepcopy(defs['AssignmentSnapshot']['properties']['components']['items']);extend(comp,{'referenceVersion':S})
    dailyLevel=copy.deepcopy(defs['HistoricalLevel']);extend(dailyLevel,{'effectiveFrom':S})
    day={'day':D,'assignmentDay':D,'timeZone':S,'ranges':ranges,'uniqueVerseCount':I,'completedComponents':arr(comp),'assignedWirdComplete':B,'completionState':S,'levelSegments':arr(dailyLevel),'proofRefs':arr(obj({'actId':S,'revision':I,'assignmentId':S})),'sourceProofHash':S,'meaningfulAt':S,'corrected':B,'eligible':B}
    defs['DailyCard']=obj({**day,**presentation})
    factSurah=obj({'kind':{'enum':['surah_completion']},'surahId':{'type':'integer','minimum':1,'maximum':114},'count':I,'proofRefs':arr(S),'countSemantics':S})
    factJuz=obj({'kind':{'enum':['juz_coverage']},'juzIds':arr(I),'additionalAssignedJuzIds':arr(I),'referenceVersion':S,'ranges':ranges,'overlapsSurahCoverage':B,'proofRefs':arr(S)})
    factPartial=obj({'kind':{'enum':['partial_reading']},'ranges':ranges,'uniqueVerseCount':I,'proofRefs':arr(S)})
    khatma=obj({'kind':{'enum':['quran_khatma']},'cycleId':S,'proofHash':S,'completedOn':D,'referenceVersion':S,'attribution':S})
    weeklyLevel=obj({'tierId':S,'colorToken':S,'effectiveFrom':S,'effectiveTo':null(S),'ruleVersion':null(S)})
    defs['WeeklyCard']=obj({**week,'readingDays':I,'facts':arr({'anyOf':[factSurah,factJuz,factPartial]}),'quranKhatmas':arr(khatma),'levelSegments':arr(weeklyLevel),'uniqueVerseCount':I,'ranges':ranges,'meaningfulAt':S,'days':arr(D),'eligible':B,'repeatPolicy':S,'status':S,**presentation})
    defs['DailyFeed']=obj({'items':arr(ref('DailyCard')),'nextCursor':null(S),'projectionRevision':I,'participantCount':{'type':'null'},'completeWirdMemberCount':I,'period':D,'timeZone':S,'status':S})
    defs['WeeklyFeed']=obj({'items':arr(ref('WeeklyCard')),'nextCursor':null(S),'projectionRevision':I,'participantCount':I,'completeWirdMemberCount':{'type':'null'},'period':D,'timeZone':S,'status':S})
    defs['OwnWeeks']=obj({'items':arr(ref('WeeklyCard')),'nextBefore':null(S),'projectionRevision':I,'visibility':S})
    defs['OwnDaily']=obj({'post':null(ref('DailyCard')),'state':S,'projectionRevision':I})
    defs['OwnDays']=obj({'weekStart':D,'days':arr(obj({**day,'privateRevisionStates':arr(obj({'id':S,'revision':I,'retracted':B})),'dailyPost':null(ref('DailyCard'))})),'visibility':S,'projectionRevision':I})
    defs['Changes']=obj({'changes':arr(obj({'cursor':I,'kind':S,'targetId':null(S),'revision':I,'card':null({'anyOf':[ref('DailyCard'),ref('WeeklyCard')]})})),'cursor':I,'projectionRevision':I})
    defs['ReadingList']=obj({'items':arr(ref('ReadingAct')),'visibility':S})
    # Learning work records vary by kind; the published course and source versions are always explicit.
    record=obj({'revision':I,'courseVersion':I,'positionSeconds':N,'completed':B,'body':S,'saved':B,'answers':{'type':'object','additionalProperties':S},'state':S,'submittedAt':null(S),'grading':S},['courseVersion','positionSeconds','completed','body','saved','answers','state','submittedAt','grading'])
    question=obj({'id':S,'prompt':S,'required':B})
    lesson=obj({'id':S,'title':S,'required':B,'thumbnail':null(S),'durationSeconds':N,'progress':null(record)})
    module=obj({'id':S,'title':S,'accessible':B,'complete':B,'lessons':arr(lesson),'questions':arr(question),'answers':null(record)})
    meta={'id':S,'title':S,'version':I,'format':S,'thumbnail':null(S),'sandbox':B}
    defs['Course']=obj({**meta,'modules':arr(module),'access':S,'complete':B})
    defs['Catalog']=obj({'items':arr(obj({**meta,'access':S,'completedModules':I,'moduleCount':I,'complete':B,'resumeLessonId':null(S)})),'nextCursor':null(S),'contentState':S})
    defs['Lesson']=obj({'id':S,'title':S,'required':B,'thumbnail':null(S),'durationSeconds':N,'resources':arr(obj({'id':S,'title':S,'url':S})),'moduleId':S,'courseId':S,'courseVersion':I,'playback':obj({'status':S,'url':null(S),'expiresAt':null(S)}),'progress':record,'note':record,'bookmark':record,'completionPolicy':S,'sandbox':B})
    defs['LearningResult']=obj({'record':record,'course':ref('Course'),'readingCredit':{'enum':[0]}})
    defs['Library']=obj({'items':arr(obj({'id':S,'version':I,'title':S,'tags':arr(S),'transcript':S,'url':null(S),'published':B,'rightsReviewed':B,'editorialReviewed':B,'sandbox':B,'courseId':S},['courseId'])),'nextCursor':null(S),'contentState':S})
    defs['OperationalResult']={'type':'object','description':'Operation-specific receipt; see CONNECTED_API_HANDOFF.md. Not a reading proof.'}
    defs['Export']={'type':'object','required':['schemaVersion','exportedAt','profile','events','reading','reader','learning','reactions','learningHistory','enrollments','reports'],'properties':{'schemaVersion':{'enum':['0.5.0']},'profile':ref('Me'),'reader':ref('Reader')}}
    from scripts.october_contracts import extend as october
    october_endpoints=october(defs)
    from scripts.launch_contracts import extend as launch
    october_endpoints+=launch(defs)
    document={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://safina.local/contracts/connected.schema.json','$defs':defs}
    (ROOT/'contracts/connected.schema.json').write_text(json.dumps(document,ensure_ascii=False,indent=2)+'\n')
    endpoints=[
      ('GET','/health',None,'OperationalResult'),('POST','/auth/register','Register','AuthState'),('POST','/auth/login','Login','Session'),('POST','/auth/verify','Verify','Session'),('POST','/auth/recover','Recover','AuthState'),('POST','/auth/reset-password','Reset','AuthState'),('GET','/auth/session',None,'Session'),('POST','/auth/refresh','EmptyBody','Session'),('POST','/auth/logout','EmptyBody','AuthState'),('POST','/auth/google','GoogleStart','Redirect'),('GET','/auth/google/callback',None,None),
      ('GET','/me',None,'Me'),('PATCH','/me','ProfilePatch','Me'),('PATCH','/me/profile','ProfilePatch','Me'),('PUT','/me/avatar','AvatarPut','Me'),('DELETE','/me/avatar','RevisionMutation','Me'),('GET','/assets/avatar/{assetId}',None,None),('GET','/me/commitment',None,'CommitmentView'),('GET','/me/commitment-history',None,'CommitmentView'),('POST','/me/commitment','CommitmentChangeRequest','ReadingMutationResult'),('POST','/commitment-changes','CommitmentChangeRequest','ReadingMutationResult'),('GET','/program-rules',None,'OperationalResult'),('GET','/today',None,'Today'),('PUT','/today/components/{componentId}','ComponentPut','ReadingResult'),('POST','/today/partial','PartialPost','ReadingResult'),('GET','/me/reading-acts',None,'ReadingList'),('PATCH','/reading-acts/{actId}','ReadingPatch','ReadingMutationResult'),('POST','/reading-acts/{actId}/retract','Retract','ReadingMutationResult'),('GET','/calendar',None,'Calendar'),('GET','/ship-progress',None,'ShipProgress'),('GET','/khatmas',None,'Khatmas'),('GET','/reader',None,'Reader'),('PUT','/reader','ReaderPut','Reader'),('GET','/quran/reference',None,'QuranReferenceVersion'),('GET','/community/context',None,'Context'),('GET','/community/daily',None,'DailyFeed'),('GET','/community/weekly',None,'WeeklyFeed'),('GET','/community/changes',None,'Changes'),('GET','/me/community/daily',None,'OwnDaily'),('GET','/me/community/weeks',None,'OwnWeeks'),('GET','/me/community/weeks/{weekStart}/days',None,'OwnDays'),('PUT','/community/daily/{targetId}/reaction','ReactionPut','Reaction'),('PUT','/community/weekly/{targetId}/reaction','ReactionPut','Reaction'),('POST','/community/reports','ReportPost','OperationalResult'),('GET','/moderation/reports',None,'OperationalResult'),('POST','/moderation/actions','ModerationPost','OperationalResult'),('GET','/learning/courses',None,'Catalog'),('GET','/learning/courses/{courseId}',None,'Course'),('GET','/learning/courses/{courseId}/lessons/{lessonId}',None,'Lesson'),('PUT','/learning/courses/{courseId}/lessons/{lessonId}/progress','ProgressPut','LearningResult'),('PUT','/learning/courses/{courseId}/lessons/{lessonId}/note','NotePut','LearningResult'),('PUT','/learning/courses/{courseId}/lessons/{lessonId}/bookmark','BookmarkPut','LearningResult'),('PUT','/learning/courses/{courseId}/modules/{moduleId}/answers','AnswersPut','LearningResult'),('POST','/learning/courses/{courseId}/modules/{moduleId}/answers/submit','AnswersPut','LearningResult'),('GET','/learning/library',None,'Library'),('GET','/learning/courses/{courseId}/lessons/{lessonId}/resources/{resourceId}',None,None),('GET','/media/playback',None,None),('GET','/me/export',None,'Export'),('POST','/me/deletion','DeletionPost','OperationalResult')]
    endpoints+=october_endpoints
    paths={}
    for verb,path,request,response in endpoints:
        schema=lambda n:{'$ref':'./connected.schema.json#/$defs/'+n}
        op={'operationId':verb.lower()+'_'+re.sub('[^a-zA-Z0-9]+','_',path).strip('_'),'responses':{'200':{'description':'Success','content':{'application/json':{'schema':schema(response)}}} if response else {'description':'Binary image or authorized redirect'},'default':{'description':'Stable error envelope','content':{'application/json':{'schema':schema('Error')}}}}}
        if path in ('/health','/auth/register','/auth/login','/auth/verify','/auth/recover','/auth/reset-password','/auth/google','/auth/google/callback'):op['security']=[]
        params=[{'name':n,'in':'path','required':True,'schema':S} for n in re.findall(r'\{(\w+)\}',path)]
        query={'/today':['date'],'/calendar':['start','end'],'/community/daily':['day','cursor','limit'],'/community/weekly':['weekStart','cursor','limit'],'/community/changes':['after','limit'],'/me/community/daily':['day'],'/me/community/weeks':['before','limit'],'/me/reading-acts':['day'],'/learning/courses':['cursor','limit'],'/learning/library':['q','cursor','limit'],'/media/playback':['ticket'],'/auth/google/callback':['code']}.get(path,[])
        params += [{'name':n,'in':'query','required':path in ('/calendar','/media/playback','/me/reading-acts','/auth/google/callback'),'schema':I if n in ('limit','after') else S} for n in query]
        if verb!='GET':params.append({'name':'Origin','in':'header','required':True,'schema':S})
        if verb!='GET' and (not path.startswith('/auth/') or path in ('/auth/refresh','/auth/logout')):params.append({'name':'X-CSRF-Token','in':'header','required':True,'schema':S})
        if params:op['parameters']=params
        if request:op['requestBody']={'required':True,'content':{'application/json':{'schema':schema(request)}}}
        paths.setdefault(path,{})[verb.lower()]=op
    api={'openapi':'3.1.0','info':{'title':'Safina connected app','version':'0.6.0','description':'Same-origin, cookie-authenticated API. Sandbox and live databases must be separate. Legacy v0.3 bearer API remains isolated.'},'servers':[{'url':'/api/v1'}],'security':[{'sessionCookie':[]}],'components':{'securitySchemes':{'sessionCookie':{'type':'apiKey','in':'cookie','name':'safina_session'}}},'paths':paths}
    (ROOT/'contracts/connected.openapi.json').write_text(json.dumps(api,ensure_ascii=False,indent=2)+'\n')
    print(f'Built {len(paths)} connected paths and {len(defs)} schemas; v0.3 contracts preserved.')
if __name__=='__main__':build()
