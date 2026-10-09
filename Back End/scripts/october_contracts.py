"""Strict additions for the v0.5 connected contract; v0.4 remains archived."""
import copy
from safina.activity import COUNTRIES,PALETTE
S={'type':'string'};B={'type':'boolean'};I={'type':'integer','minimum':0};D={'type':'string','format':'date'};U={'type':'string','format':'uuid'}
def ref(n):return {'$ref':'#/$defs/'+n}
def arr(x):return {'type':'array','items':x}
def null(x):return {'anyOf':[x,{'type':'null'}]}
def obj(p,optional=()):return {'type':'object','properties':p,'required':[k for k in p if k not in optional],'additionalProperties':False}
def add(s,p,optional=()):
 s['properties'].update(p);s['required']+= [k for k in p if k not in optional and k not in s['required']]
def extend(defs):
 ranges=arr(ref('Range'));rev={'mutationId':U,'expectedRevision':I};goal={'type':'integer','minimum':1,'maximum':1000000};count={**goal,'minimum':0};country={'enum':sorted(COUNTRIES)}
 occurrence={'occurredAt':S,'occurrenceDate':D,'timezone':S,'utcOffsetMinutes':{'type':'integer'}}
 selection={'anyOf':[obj({'kind':{'enum':['juz']},'from':{'type':'integer','minimum':1,'maximum':30},'to':{'type':'integer','minimum':1,'maximum':30}}),obj({'kind':{'enum':['surah']},'surahId':{'type':'integer','minimum':1,'maximum':114},'fromAyah':{'type':'integer','minimum':1,'maximum':286},'toAyah':{'type':'integer','minimum':1,'maximum':286}})]}
 defs['Capabilities']=obj({'version':{'enum':['0.5.0']},'customReading':B,'dailyIstighfar':B,'countrySetup':B,'emojiReactions':B,'istighfarBounds':obj({'goalMin':I,'countMin':I,'max':I}),'reactionPalette':arr({'enum':PALETTE}),'shipLifecycle':S})
 for n in ('Register','GoogleStart'):add(defs[n],{'countryCode':country,'istighfarGoal':goal},['countryCode','istighfarGoal'] if n=='GoogleStart' else [])
 # Google login is empty; onboarding must contain the full intent.
 defs['GoogleStart']={'anyOf':[obj({}),obj({k:defs['Register']['properties'][k] for k in ('displayName','countryCode','tier','istighfarGoal','communityAcknowledged')})]}
 add(defs['Me'],{'countryCode':null(country),'istighfarGoal':null(goal),'setupStatus':{'enum':['required','complete']},'capabilities':ref('Capabilities')})
 add(defs['ProfilePatch'],{'countryCode':country},['countryCode'])
 defs['GoalPut']=obj({**rev,'istighfarGoal':goal})
 defs['Istighfar']=obj({'day':D,'count':count,'target':null(goal),'complete':B,'revision':I,'updatedAt':null(S),'occurredAt':null(S),'targetPinned':B})
 defs['IstighfarPut']=obj({**rev,'day':D,'count':count,**occurrence},['occurrenceDate'])
 defs['IstighfarResult']=copy.deepcopy(defs['Istighfar']);add(defs['IstighfarResult'],{'projectionRevision':I,'today':null(ref('Today'))})
 defs['CustomSelection']=selection
 defs['CustomGroup']=obj({'groupId':U,'actId':U,'revision':I,'selection':ref('CustomSelection'),'selectionIntact':B,'ranges':ranges,'day':D,'retracted':B,'corrected':B})
 defs['CustomPost']=obj({'mutationId':U,'referenceVersion':S,'selection':ref('CustomSelection'),'ranges':ranges,**occurrence},['ranges'])
 defs['CustomPatch']=obj({**rev,'reason':S,'referenceVersion':S,'ranges':ranges})
 defs['CustomResult']=copy.deepcopy(defs['CustomGroup']);add(defs['CustomResult'],{'communityDay':D,'creditedIntersections':arr(obj({'assignmentId':S,'ranges':ranges})),'today':null(ref('Today')),'projectionRevision':I})
 add(defs['Today'],{'istighfar':ref('Istighfar'),'customReadings':arr(ref('CustomGroup'))})
 for n in ('ReadingAct','ReadingRevision'):
  if 'properties' not in defs[n]:continue
  defs[n]['properties']['source']['enum'].append('custom_reading');defs[n]['properties']['assignmentId']=null(S);defs[n]['properties']['cycleId']=null(S)
  add(defs[n],{'customGroupId':U,'customSelection':ref('CustomSelection')},['customGroupId','customSelection'])
 reaction={'reactions':arr(obj({'emoji':{'enum':PALETTE},'count':I})),'viewerReaction':null({'enum':PALETTE})}
 defs['ReactionPut']={'anyOf':[copy.deepcopy(defs['ReactionPut']),obj({**rev,'emoji':null({'enum':PALETTE})})]}
 add(defs['Reaction'],reaction)
 custom=copy.deepcopy(defs['CustomGroup']);add(custom,{'kind':{'enum':['custom_reading']},'referenceVersion':S})
 assigned=obj({'kind':{'enum':['assigned_completion']},'component':defs['DailyCard']['properties']['completedComponents']['items']})
 dhikr=obj({'kind':{'enum':['istighfar_count']},'count':count,'target':goal,'complete':B})
 daily={'facts':arr({'anyOf':[custom,assigned,dhikr]}),'istighfar':ref('Istighfar'),'istighfarComplete':B,'completeWird':B}
 add(defs['DailyCard'],daily);add(defs['OwnDays']['properties']['days']['items'],daily)
 for n in ('DailyCard','WeeklyCard'):
  add(defs[n],reaction);add(defs[n]['properties']['member'],{'countryCode':null(country)})
 for n in (defs['DailyCard'],defs['OwnDays']['properties']['days']['items']):n['properties']['proofRefs']['items']['properties']['assignmentId']=null(S)
 add(defs['WeeklyCard'],{'activityDays':I,'istighfarTotal':I})
 defs['ShipVisual']=obj({'schemaVersion':{'enum':['1.0.0-proposed']},'assetVersion':{'enum':['0.5.0']},'vesselId':U,'revision':I,'generatedAt':S,'lifecyclePolicyId':{'enum':['founder-ship-lifecycle-2026-10-01.v1']},'status':{'enum':['awaiting_policy']},'state':{'type':'null'},'blockedReasons':{'type':'array','items':S,'minItems':1}})
 add(defs['Lesson'],{'captions':arr(obj({'id':S,'language':S,'label':S,'url':S}))})
 add(defs['Lesson']['properties']['playback'],{'kind':{'enum':['youtube']},'source':obj({'videoId':S,'url':S,'sourceTitle':S,'sourceAuthor':S,'reviewedAt':S,'embeddable':B})},['kind','source'])
 return [('GET','/learning/courses/{courseId}/thumbnail',None,None),('GET','/learning/courses/{courseId}/lessons/{lessonId}/thumbnail',None,None),('GET','/learning/courses/{courseId}/lessons/{lessonId}/captions/{captionId}',None,None),('GET','/capabilities',None,'Capabilities'),('PUT','/me/istighfar-goal','GoalPut','Me'),('POST','/today/custom','CustomPost','CustomResult'),('PATCH','/custom-readings/{groupId}','CustomPatch','CustomResult'),('POST','/custom-readings/{groupId}/retract','Retract','CustomResult'),('PUT','/today/istighfar','IstighfarPut','IstighfarResult'),('GET','/ship-visual-state',None,'ShipVisual')]
