"""Additive launch schemas; earlier evidence/fixtures remain valid."""
import copy
from scripts.october_contracts import S,B,I,D,U,ref,arr,obj,add

def extend(defs):
    positive={'type':'integer','minimum':1,'maximum':6236}
    plan=obj({'period':{'enum':['daily','weekly','monthly']},'selections':{'type':'array','minItems':1,'maxItems':114,'items':obj({'surahId':{'type':'integer','minimum':1,'maximum':114},'fromAyah':{'type':'integer','minimum':1,'maximum':286},'toAyah':{'type':'integer','minimum':1,'maximum':286}})},'verseTarget':positive},['verseTarget'])
    defs['CustomWird']=plan
    # All copied historical level/commitment definitions support the new level,
    # while the standard change request still accepts only the original tiers.
    def walk(x):
        if isinstance(x,dict):
            if x.get('enum')==['B','BI','BJ1','BJ2','BJ3','BJ4','BJ5']:x['enum'].append('CUSTOM')
            if x.get('enum')==['monthly','weekly']:x['enum'].append('daily')
            if 'properties' in x and {'effectiveAt','tier','initial'}<=set(x['properties']):add(x,{'customWird':ref('CustomWird')},['customWird'])
            for v in list(x.values()):walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    walk(defs)
    defs['CommitmentChangeRequest']['properties']['tier']={'enum':['B','BI','BJ1','BJ2','BJ3','BJ4','BJ5']}
    add(defs['Register'],{'customWird':ref('CustomWird')},['customWird'])
    add(defs['GoogleStart']['anyOf'][1],{'customWird':ref('CustomWird')},['customWird'])
    add(defs['Me']['properties']['permissions'],{'superAdmin':B,'shipPreview':B},['superAdmin','shipPreview'])
    add(defs['Today'],{'customWird':obj({'period':S,'periodStart':D,'periodEnd':D,'ranges':arr(ref('Range')),'targetVerseCount':I,'coveredVerseCount':I,'complete':B,'dailyTargetVerseCount':I,'dailyCoveredVerseCount':I,'distribution':{'enum':['daily_except_saturday']}})},['customWird'])
    defs['CustomWirdPut']=obj({'mutationId':U,'expectedCommitmentId':U,'customWird':ref('CustomWird')})
    fields={'buildStep':{'type':'integer','minimum':0,'maximum':30},'health':{'type':'integer','minimum':0,'maximum':100},'celebration':B}
    defs['AdminShipPreview']=obj({'revision':I,'enabled':B,**fields})
    defs['AdminShipPreviewPut']=obj({'mutationId':U,'expectedRevision':I,**fields})
    pending=copy.deepcopy(defs['ShipVisual']);add(pending,{'earnedBuildStep':fields['buildStep']},['earnedBuildStep'])
    ready=copy.deepcopy(pending)
    ready['properties']['status']={'enum':['ready']};ready['properties']['blockedReasons']={'type':'array','maxItems':0,'items':S}
    ready['properties']['state']=obj({'phase':{'enum':['construction']},'buildStep':{'type':'integer','minimum':0,'maximum':29},'health':{'enum':[100]},'maintenanceTimezone':{'enum':['Asia/Riyadh']},'lastSettledMaintenanceDate':{'type':'null'},'nextSettlementAt':{'type':'null'}})
    defs['ShipVisual']={'anyOf':[pending,ready]}
    defs['Capabilities']['properties']['version']['enum'].append('0.6.0')
    add(defs['Capabilities'],{'customCommitment':B,'adminShipPreview':B},['customCommitment','adminShipPreview'])
    return [('GET','/admin/ship-preview',None,'AdminShipPreview'),('PUT','/admin/ship-preview','AdminShipPreviewPut','AdminShipPreview'),('DELETE','/admin/ship-preview','RevisionMutation','AdminShipPreview'),('PUT','/me/custom-wird','CustomWirdPut','CommitmentView')]
