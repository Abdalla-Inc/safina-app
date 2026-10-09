"""Durable reading-only community projections; source ledger revisions own every claim."""
import base64
import json
import secrets
from datetime import timedelta
from .domain import REF,DomainError,canonical,civil,digest,instant
from .policy_v2 import RULE,MECCA,mecca_day,week,week_status
from .service import act_day,fields,uuid,text_field
from .activity import PALETTE,split_ranges
from .custom_plans import RULE as CUSTOM_RULE

class Community:
    def __init__(self,service):self.s=service;self.db=service.store.db
    def cursor(self):return self.db.execute('SELECT coalesce(max(cursor),0) FROM community_outbox').fetchone()[0]
    def emit(self,member,kind,target,revision,payload):
        self.db.execute('INSERT OR IGNORE INTO community_outbox(event_key,kind,target_id,member_id,revision,payload,created_at) VALUES(?,?,?,?,?,?,?)',
                        (digest([member,kind,target,revision,payload]),kind,target,member,revision,canonical(payload),self.s.timestamp()))
    def profile_changed(self,member,revision):
        self.emit(member,'profile',None,revision,{})
        # Presentation changes refresh existing targets without revising activity order.
        for row in self.db.execute('SELECT id,revision FROM community_cards WHERE member_id=? AND visible=1',(member,)):
            self.emit(member,'upsert',row['id'],row['revision'],{'profileRevision':revision})
    def profile(self,member):
        r=self.db.execute('SELECT profile,status FROM accounts WHERE member_id=?',(member,)).fetchone()
        if not r:return None
        p=json.loads(r['profile']);return p if r['status']=='active' else None
    def member_view(self,member):
        p=self.profile(member)
        return {'id':member,'displayName':p['displayName'],'avatarUrl':'/api/v1/assets/avatar/'+p['avatarId'] if p['avatarId'] else None,'avatarVersion':p['avatarVersion'],'countryCode':p.get('countryCode')} if p else {'id':member,'displayName':'حساب غير متاح','avatarUrl':None,'avatarVersion':0,'countryCode':None}
    def eligible(self,member,state):
        result={}
        for a in self.s._active(state):
            if a['ruleVersion'] not in (RULE,CUSTOM_RULE):continue # Legacy and fictional browser/demo history is never imported.
            if a.get('customGroupId'):
                result.setdefault(act_day(a),[]).append((a,REF.coverage(a['ranges']),{'components':[]}));continue
            snap=self.s._snapshot(member,a['assignmentId'])
            coverage=REF.coverage(a['ranges']) & REF.coverage(snap.get('eligibleRanges',snap['ranges']))
            if coverage:result.setdefault(act_day(a),[]).append((a,coverage,snap))
        return result
    def _day(self,member,day,state,eligible):
        entries=eligible.get(day,[]);actual=frozenset().union(*(c for _,c,_ in entries))
        segments=self.s._segments(member,day,state)
        components={}
        for s in segments:
            for c in s['components']:components[(c['id'],canonical(c['ranges']))]=c
        completed=[{**c,'referenceVersion':REF.version} for c in components.values() if REF.coverage(c['ranges'])<=actual]
        ev=self.s.day(member,day,state)
        refs=[{'actId':a['id'],'revision':a['revision'],'assignmentId':a['assignmentId']} for a,_,_ in entries]
        levels=[{**x,'effectiveFrom':next(c['effectiveAt'] for c in state['commitments'] if c['id']==s['commitmentId'])}
                for x,s in zip(ev['historicalLevels'],segments)]
        dhikr=self.s.istighfar(member,day)
        custom=[{'kind':'custom_reading',**self.s.custom_view(a),'referenceVersion':REF.version} for a,_,_ in entries if a.get('customGroupId')]
        facts=[{'kind':'assigned_completion','component':c} for c in completed]+custom
        if dhikr['count']>0:facts.append({'kind':'istighfar_count',**{k:dhikr[k] for k in ('count','target','complete')}})
        meaningful=[a['updatedAt'] if a['revision']>1 else a['occurredAt'] for a in state['acts'].values() if act_day(a)==day]
        if dhikr['revision']:meaningful.append(dhikr['updatedAt'])
        return {'day':day,'facts':facts,'istighfar':dhikr,'istighfarComplete':dhikr['complete'],'completeWird':ev['status']=='completed' and not any(s['freeDay'] for s in segments),'assignmentDay':day,'timeZone':MECCA,'ranges':REF.ranges(actual),'uniqueVerseCount':len(actual),
                'completedComponents':completed,'assignedWirdComplete':ev['status']=='completed' and not any(s['freeDay'] for s in segments),
                'completionState':ev['status'],'levelSegments':levels,'proofRefs':refs,'sourceProofHash':digest([day,refs,REF.ranges(actual)]),
                'meaningfulAt':max(meaningful,key=instant,default=day+'T00:00:00+03:00'),
                'corrected':ev['corrected'],'eligible':bool(actual) or dhikr['count']>0,'privateRevisionStates':[{'id':a['id'],'revision':a['revision'],'retracted':a['retracted']} for a in state['acts'].values() if act_day(a)==day]}
    def _weekly(self,member,start,days,state,eligible,khatmas):
        w=week(start);selected=[d for d in days if w['weekStart']<=d['day']<=w['weekEnd'] and d['eligible']]
        union=frozenset().union(*(REF.coverage(d['ranges']) for d in selected));facts=[];surahs=set()
        for n in range(1,115):
            complete=REF.coverage([{'start':f'{n}:1','end':f'{n}:{REF.data["verseCounts"][n-1]}'}])
            proofs=[d['sourceProofHash'] for d in selected if complete<=REF.coverage(d['ranges'])]
            if complete<=union:
                surahs.update(complete)
                facts.append({'kind':'surah_completion','surahId':n,'count':max(1,len(proofs)),
                              'proofRefs':proofs or [digest([start,member,REF.ranges(complete)])],
                              'countSemantics':'distinct_completed_days; within-day explicit repeats do not add unapproved completions'})
        juzs=[j for j in range(1,31) if REF.juz(j)<=union]
        assigned=set()
        for d in selected:
            for _,_,snap in eligible.get(d['day'],[]):
                for c in snap['components']:
                    if c['id'].startswith('J') and c['id'][1:].isdigit():assigned.add(int(c['id'][1:]))
        if juzs:facts.append({'kind':'juz_coverage','juzIds':juzs,'additionalAssignedJuzIds':[j for j in juzs if j in assigned and REF.juz(j)-surahs],
                              'referenceVersion':REF.version,'ranges':REF.ranges(set().union(*(REF.juz(j) for j in juzs))),
                              'overlapsSurahCoverage':True,'proofRefs':[d['sourceProofHash'] for d in selected]})
        partial=union-surahs
        if partial:facts.append({'kind':'partial_reading','ranges':REF.ranges(partial),'uniqueVerseCount':len(partial),'proofRefs':[d['sourceProofHash'] for d in selected]})
        proven=[]
        for k in khatmas['cycles']:
            if k['status']!='complete' or not w['weekStart']<=k['completionDate']<=w['weekEnd']:continue
            cycle_eligible=frozenset().union(*(c for entries in eligible.values() for a,c,_ in entries if a['cycleId']==k['id']))
            if cycle_eligible!=REF.all:continue
            proven.append({'kind':'quran_khatma','cycleId':k['id'],'proofHash':k['proofHash'],'completedOn':k['completionDate'],
                           'referenceVersion':REF.version,'attribution':'completed_in_this_week; coverage_may_start_in_an_earlier_week'})
        segments=[]
        for i,c in enumerate(state['commitments']):
            end=state['commitments'][i+1]['effectiveAt'] if i+1<len(state['commitments']) else None
            if instant(c['effectiveAt'])<instant(w['endExclusive']) and (not end or instant(end)>instant(w['startAt'])):
                segments.append({'tierId':c['tier'],'colorToken':'level.'+c['tier'],'effectiveFrom':c['effectiveAt'],'effectiveTo':end,'ruleVersion':c.get('ruleVersion')})
        return {**w,'readingDays':sum(bool(d['uniqueVerseCount']) for d in selected),'activityDays':len(selected),'istighfarTotal':sum(d['istighfar']['count'] for d in selected),'facts':facts,'quranKhatmas':proven,'levelSegments':segments,
                'uniqueVerseCount':len(union),'ranges':REF.ranges(union),'meaningfulAt':max((d['meaningfulAt'] for d in selected),key=instant,default=w['startAt']),
                'days':[d['day'] for d in sorted(selected,key=lambda d:d['day'],reverse=True)],'eligible':bool(selected),
                'repeatPolicy':'Within-day repeated acts retained privately; additional completion counts await policy.'}
    def rebuild(self,member):
        account=self.db.execute('SELECT * FROM accounts WHERE member_id=?',(member,)).fetchone()
        if not account:return
        p=json.loads(account['profile']);state=self.s.state(member);eligible=self.eligible(member,state)
        dates=sorted({act_day(a) for a in state['acts'].values()}|{r['day'] for r in self.db.execute('SELECT day FROM istighfar_days WHERE member_id=?',(member,))})
        days=[self._day(member,d,state,eligible) for d in dates]
        existing=self.db.execute('SELECT kind,period FROM community_cards WHERE member_id=?',(member,)).fetchall()
        starts={week(d)['weekStart'] for d in dates}|{r['period'] for r in existing if r['kind']=='weekly'}
        khatmas=self.s.khatmas(member,state)
        source=max((e['sequence'] for e in self.s.store.events(member)),default=0)
        public=account['status']=='active' and p['communityVisible'] and bool(p.get('communityAcknowledgedAt'))
        for d in days:self._upsert(member,'daily',d['day'],d,public and bool(d['facts']),source)
        for start in sorted(starts):
            w=self._weekly(member,start,days,state,eligible,khatmas)
            self._upsert(member,'weekly',start,w,public and w['eligible'],source)
    def _upsert(self,member,kind,period,payload,visible,source):
        id=f'{kind}:{member}:{period}';old=self.db.execute('SELECT * FROM community_cards WHERE id=?',(id,)).fetchone()
        if old and source<old['source_sequence']:return
        public_payload={k:v for k,v in payload.items() if k!='privateRevisionStates'}
        if old and old['payload']==canonical(public_payload) and bool(old['visible'])==bool(visible):return
        revision=old['revision']+1 if old else 1
        self.db.execute('INSERT INTO community_cards VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,source_sequence=excluded.source_sequence,visible=excluded.visible,meaningful_at=excluded.meaningful_at',
                        (id,member,kind,period,canonical(public_payload),revision,source,int(visible),instant(payload['meaningfulAt']).isoformat()))
        if visible or (old and old['visible']):self.emit(member,'upsert' if visible else 'withdraw',id,revision,{'targetType':kind,'period':period})
    def _visible(self,row,viewer,own=False):
        p=self.profile(row['member_id'])
        if not p:return False
        if own and row['member_id']==viewer:return True
        return bool(row['visible'] and p['communityVisible'] and not self.db.execute('SELECT 1 FROM hidden_cards WHERE target_id=?',(row['id'],)).fetchone())
    def present(self,row,viewer,own=False):
        p=json.loads(row['payload']);p.update(id=row['id'],member=self.member_view(row['member_id']),revision=row['revision'],projectionState='ready',sourceSequence=row['source_sequence'])
        if row['kind']=='weekly':p['status']=week_status(row['period'],self.s.now())
        p['reactions']=[{'emoji':r['emoji'],'count':r['n']} for r in self.db.execute('SELECT emoji,count(*) AS n FROM reactions r JOIN accounts a ON a.member_id=r.member_id WHERE target_id=? AND emoji IS NOT NULL AND a.status=? GROUP BY emoji ORDER BY emoji',(row['id'],'active'))]
        p['heartCount']=next((r['count'] for r in p['reactions'] if r['emoji']=='❤️'),0)
        heart=self.db.execute('SELECT emoji,revision FROM reactions WHERE member_id=? AND target_id=?',(viewer,row['id'])).fetchone()
        p['viewerReaction']=heart['emoji'] if heart else None;p['viewerReacted']=p['viewerReaction']=='❤️';p['reactionRevision']=heart['revision'] if heart else 0
        p['visibility']='visible' if self._visible(row,viewer) else 'withdrawn'
        return p
    def paginate(self,viewer,scope,rows,cursor=None,limit=20):
        if type(limit)!=int or not 1<=limit<=50:raise DomainError('INVALID_LIMIT','Limit must be 1–50.')
        if cursor:
            try:
                sid,index=cursor.split('.');index=int(index)
                snap=self.db.execute('SELECT * FROM feed_snapshots WHERE id=? AND member_id=? AND scope=?',(sid,viewer,scope)).fetchone()
                if not snap or instant(snap['expires_at'])<self.s.now() or index<0:raise ValueError()
                saved=json.loads(snap['payload'])
            except (ValueError,TypeError):raise DomainError('INVALID_CURSOR','أعد تحميل القائمة.',409)
            indexed={r['id']:r for r in rows}
            # New arrivals are excluded from this traversal. Changed/withdrawn old claims force a clean refresh.
            if any(x['id'] not in indexed or indexed[x['id']]['revision']!=x['revision'] for x in saved['rows']):raise DomainError('PROJECTION_CHANGED','تغيّرت القراءات. حدّث القائمة.',409)
            ordered=[indexed[x['id']] for x in saved['rows']];revision=saved['projectionRevision']
        else:
            sid=secrets.token_urlsafe(24);index=0;ordered=rows;revision=self.cursor()
            saved={'rows':[{'id':r['id'],'revision':r['revision']} for r in rows],'projectionRevision':revision}
            self.db.execute('INSERT INTO feed_snapshots VALUES(?,?,?,?,?)',(sid,viewer,scope,canonical(saved),(self.s.now()+timedelta(minutes=15)).isoformat()))
        next_index=index+limit
        return ordered[index:next_index],(sid+'.'+str(next_index) if next_index<len(ordered) else None),revision,len(ordered)
    def feed(self,viewer,kind,period,cursor=None,limit=20):
        if kind=='weekly':
            if week(period)['weekStart']!=period:raise DomainError('INVALID_WEEK','Expected a Sunday week start.')
        else:civil(period)
        rows=[r for r in self.db.execute('SELECT * FROM community_cards WHERE kind=? AND period=? ORDER BY meaningful_at DESC,id',(kind,period)) if self._visible(r,viewer)]
        page,nxt,revision,total=self.paginate(viewer,kind+':'+period,rows,cursor,limit)
        full=sum(json.loads(r['payload']).get('assignedWirdComplete',False) for r in rows)
        # Counter is from the same membership snapshot, not a mixture of older cards/new members.
        if cursor:
            saved=json.loads(self.db.execute('SELECT payload FROM feed_snapshots WHERE id=?',(cursor.split('.')[0],)).fetchone()[0]);ids={x['id'] for x in saved['rows']}
            full=sum(json.loads(r['payload']).get('assignedWirdComplete',False) for r in rows if r['id'] in ids)
        return {'items':[self.present(r,viewer) for r in page],'nextCursor':nxt,'projectionRevision':revision,
                'participantCount':total if kind=='weekly' else None,'completeWirdMemberCount':full if kind=='daily' else None,
                'period':period,'timeZone':MECCA,'status':week_status(period,self.s.now()) if kind=='weekly' else 'daily'}
    def own_post(self,member,day):
        civil(day);r=self.db.execute('SELECT * FROM community_cards WHERE member_id=? AND kind=? AND period=?',(member,'daily',day)).fetchone()
        return {'post':self.present(r,member,True) if r and self._visible(r,member,True) else None,'state':'present' if r and r['visible'] else 'no_public_post','projectionRevision':self.cursor()}
    def own_weeks(self,member,before=None,limit=12):
        state=self.s.state(member);eligible=self.eligible(member,state)
        starts={week(mecca_day(self.s.now()))['weekStart']}
        starts.update(r['period'] for r in self.db.execute("SELECT period FROM community_cards WHERE member_id=? AND kind='weekly'",(member,)))
        rows=[]
        for w in sorted(starts,reverse=True):
            r=self.db.execute("SELECT * FROM community_cards WHERE member_id=? AND kind='weekly' AND period=?",(member,w)).fetchone()
            if not r:
                payload=self._weekly(member,w,[],state,eligible,{'cycles':[]})
                r={'id':f'weekly:{member}:{w}','member_id':member,'kind':'weekly','period':w,'payload':canonical(payload),'revision':0,'source_sequence':0,'visible':0,'meaningful_at':payload['meaningfulAt']}
            rows.append(r)
        page,nxt,revision,total=self.paginate(member,'own_weeks',rows,before,limit)
        return {'items':[self.present(r,member,True) for r in page],'nextBefore':nxt,'projectionRevision':revision,'visibility':'private'}
    def own_days(self,member,start):
        w=week(start)
        if w['weekStart']!=start:raise DomainError('INVALID_WEEK','Expected a Sunday week start.')
        state=self.s.state(member);eligible=self.eligible(member,state)
        all_dates={act_day(a) for a in state['acts'].values()}|{r['day'] for r in self.db.execute('SELECT day FROM istighfar_days WHERE member_id=?',(member,))}
        dates=sorted((d for d in all_dates if w['weekStart']<=d<=w['weekEnd']),reverse=True)
        return {'weekStart':start,'days':[{**self._day(member,d,state,eligible),'dailyPost':self.own_post(member,d)['post']} for d in dates],'visibility':'private','projectionRevision':self.cursor()}
    def reaction(self,member,kind,target,body):
        fields(body,['mutationId','expectedRevision','emoji'] if 'emoji' in body else ['mutationId','reacted'],[] if 'emoji' in body else ['expectedRevision'])
        if 'emoji' in body:
            emoji=body['emoji']
            if emoji is not None and emoji not in PALETTE:raise DomainError('INVALID_REACTION','اختر تفاعلاً من القائمة.')
        else:
            if type(body['reacted']) is not bool:raise DomainError('INVALID_REACTION','reacted must be boolean.')
            emoji='❤️' if body['reacted'] else None
        row=self.db.execute('SELECT * FROM community_cards WHERE id=? AND kind=?',(target,kind)).fetchone()
        if not row or not self._visible(row,member):raise DomainError('TARGET_WITHDRAWN','هذا المنشور غير متاح.',404)
        old=self.db.execute('SELECT * FROM reactions WHERE member_id=? AND target_id=?',(member,target)).fetchone();revision=old['revision'] if old else 0
        if type(body.get('expectedRevision',revision)) is not int or body.get('expectedRevision',revision)!=revision:raise DomainError('REVISION_CONFLICT','تغيّر التفاعل. حدّثه ثم حاول.',409,currentRevision=revision)
        self.db.execute('INSERT INTO reactions(member_id,target_id,reacted,revision,emoji) VALUES(?,?,?,?,?) ON CONFLICT(member_id,target_id) DO UPDATE SET reacted=excluded.reacted,revision=excluded.revision,emoji=excluded.emoji',(member,target,int(emoji=='❤️'),revision+1,emoji))
        self.emit(member,'reaction',target,revision+1,{'targetType':kind})
        p=self.present(row,member);return {k:p[k] for k in ('id','heartCount','viewerReacted','reactionRevision','reactions','viewerReaction')}
    def changes(self,member,after=0,limit=50):
        if after<0 or not 1<=limit<=100:raise DomainError('INVALID_CURSOR','Invalid polling cursor or limit.')
        rows=self.db.execute('SELECT * FROM community_outbox WHERE cursor>? ORDER BY cursor LIMIT ?',(after,limit)).fetchall();out=[]
        for e in rows:
            if not e['target_id']:
                if e['member_id']==member:out.append({'cursor':e['cursor'],'kind':e['kind'],'targetId':None,'revision':e['revision'],'card':None})
                continue
            card=self.db.execute('SELECT * FROM community_cards WHERE id=?',(e['target_id'],)).fetchone()
            visible=bool(card and self._visible(card,member))
            # Only target identity/tombstone is delivered on withdrawal; never private ranges or member emails.
            out.append({'cursor':e['cursor'],'kind':e['kind'] if visible else 'withdraw','targetId':e['target_id'],'revision':card['revision'] if card else e['revision'],
                        'card':self.present(card,member) if visible else None})
        return {'changes':out,'cursor':rows[-1]['cursor'] if rows else after,'projectionRevision':self.cursor()}
    def report(self,member,body):
        from uuid import uuid4
        fields(body,['mutationId','targetId','reason']);text_field(body['reason'],2000)
        row=self.db.execute('SELECT * FROM community_cards WHERE id=?',(body['targetId'],)).fetchone()
        if not row or not self._visible(row,member):raise DomainError('NOT_FOUND','المنشور غير متاح.',404)
        id=str(uuid4());self.db.execute('INSERT INTO community_reports VALUES(?,?,?,?,?,?)',(id,member,row['id'],body['reason'],'open',self.s.timestamp()))
        return {'id':id,'status':'open'}
    def moderate(self,member,body):
        from uuid import uuid4
        fields(body,['mutationId','targetId','action','reason']);text_field(body['reason'],2000)
        if not self.s.me(member)['permissions']['moderate']:raise DomainError('FORBIDDEN','هذا الإجراء للمشرفين فقط.',403)
        if body['action'] not in ('hide','restore'):raise DomainError('INVALID_ACTION','الإجراء غير صالح.')
        row=self.db.execute('SELECT * FROM community_cards WHERE id=?',(body['targetId'],)).fetchone()
        if not row:raise DomainError('NOT_FOUND','المنشور غير موجود.',404)
        if body['action']=='hide':self.db.execute('INSERT OR REPLACE INTO hidden_cards VALUES(?,?)',(row['id'],body['reason']))
        else:self.db.execute('DELETE FROM hidden_cards WHERE target_id=?',(row['id'],))
        id=str(uuid4());self.db.execute('INSERT INTO moderation_actions VALUES(?,?,?,?,?,?)',(id,member,row['id'],body['action'],body['reason'],self.s.timestamp()))
        self.db.execute('UPDATE community_reports SET status=? WHERE target_id=?',('resolved',row['id']))
        self.db.execute('UPDATE community_cards SET revision=revision+1 WHERE id=?',(row['id'],))
        self.emit(row['member_id'],'withdraw' if body['action']=='hide' else 'upsert',row['id'],row['revision']+1,{'moderation':True})
        return {'id':id,'action':body['action']}
