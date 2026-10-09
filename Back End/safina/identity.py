"""Provider-backed identity and opaque browser sessions. Sandbox is explicitly local."""
import base64
import hashlib
import hmac
import json
import re
import secrets
import sqlite3
from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import urlencode,urlsplit
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from uuid import uuid4
from .domain import DomainError,canonical,instant,zone,TIERS
from .policy_v2 import RULE,MECCA,mecca_day
from .service import fields,text_field
from .activity import country_code, bounded_count

AR={'UNAUTHORIZED':'انتهت الجلسة. سجّل الدخول من جديد.','INVALID_CREDENTIALS':'تعذّر تسجيل الدخول. راجع البريد وكلمة المرور.',
    'EMAIL_NOT_VERIFIED':'تحقّق من بريدك الإلكتروني أولاً.','AUTH_PROVIDER_NOT_CONFIGURED':'تسجيل الدخول الخارجي يحتاج إعداد خدمة الحسابات.',
    'REVISION_CONFLICT':'تغيّرت البيانات. حدّث الصفحة ثم راجع التعديل.','RATE_LIMITED':'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.',
    'INVITATION_REQUIRED':'التسجيل متاح للأعضاء المدعوين حالياً.'}
def hashed(value):return hashlib.sha256(value.encode()).hexdigest()
def email(value):
    if not isinstance(value,str) or len(value)>254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',value):raise DomainError('INVALID_EMAIL','أدخل بريداً إلكترونياً صالحاً.')
    return value.strip().casefold()
def password(value):
    if not isinstance(value,str) or not 12<=len(value)<=256:raise DomainError('INVALID_PASSWORD','استخدم كلمة مرور من ١٢ حرفاً على الأقل.')
    return value

def pw_hash(value,salt=None):
    salt=salt or secrets.token_hex(16)
    from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
    return salt+':'+Scrypt(salt=bytes.fromhex(salt),length=64,n=16384,r=8,p=1).derive(value.encode()).hex()

@dataclass
class Config:
    key: bytes
    mode: str='sandbox'
    origin: str='http://127.0.0.1:5178'
    supabase_url: str=''
    supabase_key: str=''
    invitations_required: bool=True
    session_minutes: int=60
    storage_key: str=""
    super_admin_email: str=""
    def __post_init__(self):
        if len(self.key)<32:raise ValueError('A stable server key of at least 32 bytes is required.')
        origin=urlsplit(self.origin)
        if origin.scheme not in ('http','https') or not origin.hostname or origin.path or origin.query or origin.fragment or origin.username:raise ValueError('Use an exact HTTP(S) application origin without a path.')
        if self.mode=='supabase' and origin.scheme!='https' and origin.hostname not in ('localhost','127.0.0.1'):raise ValueError('Live public application origins require HTTPS.')
        if self.mode not in ('sandbox','supabase'):raise ValueError('Unknown identity mode.')
        if self.mode=='sandbox' and urlsplit(self.origin).hostname not in ('localhost','127.0.0.1'):raise ValueError('Sandbox identity is loopback-only.')
        if self.mode=='supabase' and (not self.supabase_url.startswith('https://') or not self.supabase_key):raise ValueError('Configure Supabase HTTPS URL and publishable/anon key.')
    @property
    def secure(self):return self.origin.startswith('https://')
    def encrypt(self,value):
        from cryptography.fernet import Fernet
        return Fernet(base64.urlsafe_b64encode(hashlib.sha256(self.key).digest())).encrypt(canonical(value).encode()).decode()
    def decrypt(self,value):
        from cryptography.fernet import Fernet
        return json.loads(Fernet(base64.urlsafe_b64encode(hashlib.sha256(self.key).digest())).decrypt(value.encode()))

class Supabase:
    """Only the configured provider is contacted. No access/refresh token reaches JS."""
    def __init__(self,config):self.config=config
    def call(self,method,path,body=None,access=None):
        headers={'apikey':self.config.supabase_key,'Content-Type':'application/json'}
        if access:headers['Authorization']='Bearer '+access
        req=Request(self.config.supabase_url.rstrip('/')+'/auth/v1'+path,data=canonical(body).encode() if body is not None else None,headers=headers,method=method)
        try:
            with urlopen(req,timeout=15) as r:
                raw=r.read(131072);return json.loads(raw) if raw else {}
        except HTTPError as e:
            status=429 if e.code==429 else (503 if e.code>=500 else 401)
            code='RATE_LIMITED' if status==429 else ('IDENTITY_UNAVAILABLE' if status==503 else 'INVALID_CREDENTIALS')
            raise DomainError(code,AR.get(code,'خدمة الحسابات غير متاحة حالياً.'),status)
        except (URLError,TimeoutError,ValueError):raise DomainError('IDENTITY_UNAVAILABLE','خدمة الحسابات غير متاحة حالياً.',503)
    def checked_user(self,tokens):
        user=self.call('GET','/user',access=tokens['access_token'])
        if not user.get('email_confirmed_at'):raise DomainError('EMAIL_NOT_VERIFIED',AR['EMAIL_NOT_VERIFIED'],403)
        return user

class Identity:
    def __init__(self,service,config):self.s=service;self.db=service.store.db;self.config=config;self.provider=Supabase(config)
    def rate_limit(self,bucket,maximum=20,seconds=60):
        window=int(self.s.now().timestamp())//seconds
        self.db.execute('INSERT INTO rate_limits VALUES(?,?,1) ON CONFLICT(bucket,window) DO UPDATE SET count=count+1',(hashed(bucket),window))
        n=self.db.execute('SELECT count FROM rate_limits WHERE bucket=? AND window=?',(hashed(bucket),window)).fetchone()[0]
        if n>maximum:raise DomainError('RATE_LIMITED',AR['RATE_LIMITED'],429,retryAfter=seconds)
    def _admit(self,address):
        if self.config.mode!='sandbox' and self.config.invitations_required:
            if not self.db.execute('SELECT 1 FROM auth_invites WHERE email_hash=?',(hashed(address),)).fetchone():raise DomainError('INVITATION_REQUIRED',AR['INVITATION_REQUIRED'],403)
    def _intent(self,body):
        fields(body,['displayName','tier','communityAcknowledged','countryCode','istighfarGoal'],['email','password','customWird'])
        country_code(body['countryCode']);bounded_count(body['istighfarGoal'],1)
        if body['tier'] not in (*TIERS,'CUSTOM'):raise DomainError('INVALID_TIER','اختر مستوى صالحاً.')
        text_field(body['displayName'],80)
        if type(body['communityAcknowledged']) is not bool or not body['communityAcknowledged']:raise DomainError('COMMUNITY_SCOPE_REQUIRED','اقرأ نطاق المشاركة التلقائية وأكّد فهمه قبل إنشاء الحساب.')
        result={k:body[k] for k in ('displayName','tier','communityAcknowledged','countryCode','istighfarGoal')}
        if body['tier']=='CUSTOM':
            from .custom_plans import normalize
            result['customWird']=normalize(body.get('customWird'))
        elif 'customWird' in body:raise DomainError('INVALID_FIELDS','الورد المخصص يتطلب اختيار CUSTOM.')
        return result
    def _create_account(self,user,intent):
        provider=self.config.mode;subject=user['id'];address=email(user['email'])
        old=self.db.execute('SELECT * FROM accounts WHERE provider=? AND subject=?',(provider,subject)).fetchone()
        if old:
            if old['status']!='active':raise DomainError('ACCOUNT_UNAVAILABLE','هذا الحساب غير متاح.',403)
            return old['member_id']
        if not intent:raise DomainError('ONBOARDING_REQUIRED','ابدأ بإنشاء الحساب واختيار الورد.',409)
        self._admit(address);mid=str(uuid4());now=self.s.timestamp()
        self.s.store.create_member(mid,MECCA,now) # legacy random bearer is never issued to connected members
        profile={'countryCode':country_code(intent['countryCode']),'istighfarGoal':intent['istighfarGoal'],'displayName':intent['displayName'].strip(),'avatarId':None,'avatarVersion':0,'locale':'ar','reducedMotion':False,'largeText':False,
                 'communityVisible':True,'communityAcknowledgedAt':now,'communityScopeVersion':RULE}
        self.db.execute('INSERT INTO accounts(member_id,provider,subject,email,status,profile,created_at) VALUES(?,?,?,?,?,?,?)',(mid,provider,subject,address,'active',canonical(profile),now))
        c={'id':str(uuid4()),'tier':intent['tier'],'effectiveAt':now,'timezone':MECCA,'initial':True,'ruleVersion':RULE}
        if intent['tier']=='CUSTOM':
            from .custom_plans import RULE as CUSTOM_RULE
            c.update(ruleVersion=CUSTOM_RULE,customWird=intent['customWird'])
        self.s.store.event(mid,'CommitmentSet',c['id'],c,now);self.s.store.record('Commitment',c['id'],mid,c)
        self.db.execute('UPDATE auth_invites SET used_by=? WHERE email_hash=?',(mid,hashed(address)))
        return mid
    def _challenge(self,subject,address,kind):
        code=secrets.token_urlsafe(24);cid=str(uuid4());expires=(self.s.now()+timedelta(minutes=30)).isoformat()
        self.db.execute('UPDATE auth_challenges SET used=1 WHERE subject=? AND kind=?',(subject,kind))
        self.db.execute('INSERT INTO auth_challenges(id,subject,kind,token_hash,expires_at) VALUES(?,?,?,?,?)',(cid,subject,kind,hashed(code),expires))
        # Local mailbox is an explicit test double; no emails are sent or exposed over HTTP.
        self.db.execute('INSERT INTO sandbox_mailbox(email,kind,payload,created_at) VALUES(?,?,?,?)',(address,kind,canonical({'code':code,'expiresAt':expires}),self.s.timestamp()))
    def register(self,body):
        fields(body,['email','password','displayName','tier','communityAcknowledged','countryCode','istighfarGoal'],['customWird'])
        address=email(body['email']);pw=password(body['password']);intent=self._intent(body);self._admit(address)
        if self.config.mode=='sandbox':
            with self.s.store.transaction():
                old=self.db.execute('SELECT id FROM sandbox_identities WHERE email=?',(address,)).fetchone()
                if not old:
                    user={'id':str(uuid4()),'email':address}
                    self.db.execute('INSERT INTO sandbox_identities VALUES(?,?,?,0)',(user['id'],address,pw_hash(pw)))
                    self._create_account(user,intent);self._challenge(user['id'],address,'signup')
        else:
            out=self.provider.call('POST','/signup',{'email':address,'password':pw})
            user=out.get('user',out)
            if user.get('id'):
                with self.s.store.transaction():self._create_account(user,intent)
        return {'state':'verification_required','message':'تحقّق من بريدك لتأكيد الحساب.','delivery':'local_mailbox' if self.config.mode=='sandbox' else 'provider'}
    def _new_session(self,member,tokens=None,verified_email=None):
        # Called only after a provider-verified identity or verified local mailbox.
        account=self.s.account(member)
        if self.config.super_admin_email and verified_email and email(verified_email)==email(self.config.super_admin_email) and account['email']==email(verified_email) and account['role']!='founder':
            self.db.execute("UPDATE accounts SET role='founder',revision=revision+1 WHERE member_id=?",(member,))
        token=secrets.token_urlsafe(40);csrf=secrets.token_urlsafe(32);now=self.s.now()
        expires=now+timedelta(minutes=self.config.session_minutes);absolute=now+timedelta(days=7)
        self.db.execute('INSERT INTO sessions(token_hash,member_id,csrf_hash,csrf_secret,provider_session,expires_at,absolute_expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)',
                        (hashed(token),member,hashed(csrf),self.config.encrypt(csrf),self.config.encrypt(tokens) if tokens else None,expires.isoformat(),absolute.isoformat(),now.isoformat()))
        return {'memberId':member,'csrfToken':csrf,'expiresAt':expires.isoformat(),'mode':self.config.mode},token
    def login(self,body):
        fields(body,['email','password']);address=email(body['email']);text_field(body['password'],256)
        if self.config.mode=='sandbox':
            row=self.db.execute('SELECT * FROM sandbox_identities WHERE email=?',(address,)).fetchone()
            dummy='0'*32
            test=pw_hash(body['password'],row['password_hash'].split(':')[0] if row else dummy)
            if not row or not hmac.compare_digest(test,row['password_hash']):raise DomainError('INVALID_CREDENTIALS',AR['INVALID_CREDENTIALS'],401)
            if not row['verified']:raise DomainError('EMAIL_NOT_VERIFIED',AR['EMAIL_NOT_VERIFIED'],403)
            user={'id':row['id'],'email':address};tokens=None
        else:
            tokens=self.provider.call('POST','/token?grant_type=password',{'email':address,'password':body['password']});user=self.provider.checked_user(tokens)
        with self.s.store.transaction():return self._new_session(self._create_account(user,None),tokens,user['email'])
    def verify(self,body):
        fields(body,['email','code']);address=email(body['email']);text_field(body['code'],256)
        if self.config.mode=='sandbox':
            with self.s.store.transaction():
                user=self._consume(address,body['code'],'signup');self.db.execute('UPDATE sandbox_identities SET verified=1 WHERE id=?',(user['id'],))
                return self._new_session(self._create_account(user,None),verified_email=user['email'])
        tokens=self.provider.call('POST','/verify',{'email':address,'token':body['code'],'type':'signup'});user=self.provider.checked_user(tokens)
        with self.s.store.transaction():return self._new_session(self._create_account(user,None),tokens,user['email'])
    def _consume(self,address,code,kind):
        user=self.db.execute('SELECT id,email FROM sandbox_identities WHERE email=?',(address,)).fetchone()
        row=self.db.execute('SELECT * FROM auth_challenges WHERE subject=? AND kind=? AND token_hash=? AND used=0',(user['id'] if user else '',kind,hashed(code))).fetchone()
        if not row or instant(row['expires_at'])<self.s.now():raise DomainError('INVALID_VERIFICATION','رمز التحقّق غير صالح أو منتهي.',401)
        self.db.execute('UPDATE auth_challenges SET used=1 WHERE id=?',(row['id'],));return dict(user)
    def recover(self,body):
        fields(body,['email']);address=email(body['email'])
        if self.config.mode=='sandbox':
            with self.s.store.transaction():
                user=self.db.execute('SELECT * FROM sandbox_identities WHERE email=?',(address,)).fetchone()
                if user:self._challenge(user['id'],address,'recovery')
        else:self.provider.call('POST','/recover',{'email':address})
        return {'state':'recovery_requested','message':'إذا كان الحساب موجوداً، ستصلك تعليمات الاستعادة.','delivery':'local_mailbox' if self.config.mode=='sandbox' else 'provider'}
    def reset_password(self,body):
        fields(body,['email','code','password']);address=email(body['email']);pw=password(body['password'])
        if self.config.mode=='sandbox':
            with self.s.store.transaction():
                user=self._consume(address,body['code'],'recovery');self.db.execute('UPDATE sandbox_identities SET password_hash=?,verified=1 WHERE id=?',(pw_hash(pw),user['id']))
                mid=self._create_account(user,None);self.db.execute('UPDATE sessions SET revoked=1 WHERE member_id=?',(mid,))
        else:
            tokens=self.provider.call('POST','/verify',{'email':address,'token':body['code'],'type':'recovery'});user=self.provider.checked_user(tokens)
            self.provider.call('PUT','/user',{'password':pw},tokens['access_token'])
            with self.s.store.transaction():
                mid=self._create_account(user,None);self.db.execute('UPDATE sessions SET revoked=1 WHERE member_id=?',(mid,))
        return {'state':'password_updated','message':'حُدّثت كلمة المرور. سجّل الدخول مجدداً.'}
    def session(self,token,csrf=None,write=False,allow_expired=False):
        if not isinstance(token,str) or not token:raise DomainError('UNAUTHORIZED',AR['UNAUTHORIZED'],401)
        row=self.db.execute('SELECT s.*,a.status,a.provider FROM sessions s JOIN accounts a ON a.member_id=s.member_id WHERE token_hash=?',(hashed(token),)).fetchone()
        if not row or row['provider']!=self.config.mode or row['revoked'] or row['status']!='active' or instant(row['absolute_expires_at'])<=self.s.now() or (not allow_expired and instant(row['expires_at'])<=self.s.now()):raise DomainError('UNAUTHORIZED',AR['UNAUTHORIZED'],401)
        if write and (not csrf or not hmac.compare_digest(hashed(csrf),row['csrf_hash'])):raise DomainError('CSRF_REJECTED','أعد تحميل الصفحة قبل المتابعة.',403)
        return dict(row)
    def session_view(self,token):
        row=self.session(token);return {'memberId':row['member_id'],'csrfToken':self.config.decrypt(row['csrf_secret']),'expiresAt':row['expires_at'],'mode':self.config.mode}
    def refresh(self,token,csrf):
        with self.s.store.transaction():
            row=self.session(token,csrf,True,True);tokens=self.config.decrypt(row['provider_session']) if row['provider_session'] else None
            if tokens:
                tokens=self.provider.call('POST','/token?grant_type=refresh_token',{'refresh_token':tokens['refresh_token']});user=self.provider.checked_user(tokens)
                account=self.s.account(row['member_id'])
                if user['id']!=account['subject']:raise DomainError('INVALID_CREDENTIALS',AR['INVALID_CREDENTIALS'],401)
            self.db.execute('UPDATE sessions SET revoked=1 WHERE token_hash=?',(row['token_hash'],))
            result,new=self._new_session(row['member_id'],tokens)
            # Preserve absolute session lifetime while rotating both secrets.
            self.db.execute('UPDATE sessions SET absolute_expires_at=? WHERE token_hash=?',(row['absolute_expires_at'],hashed(new)))
            return result,new
    def logout(self,token,csrf):
        with self.s.store.transaction():
            row=self.session(token,csrf,True,True);self.db.execute('UPDATE sessions SET revoked=1 WHERE member_id=?',(row['member_id'],))
        return {'state':'signed_out'}
    def google_start(self,body):
        if self.config.mode!='supabase':raise DomainError('AUTH_PROVIDER_NOT_CONFIGURED',AR['AUTH_PROVIDER_NOT_CONFIGURED'],503)
        fields(body,[],['displayName','tier','communityAcknowledged','countryCode','istighfarGoal','customWird']);intent=self._intent(body) if body else None
        flow=secrets.token_urlsafe(32);verifier=secrets.token_urlsafe(64)
        data={'verifier':verifier,'intent':intent}
        self.db.execute('INSERT INTO auth_flows(id,payload,expires_at) VALUES(?,?,?)',(hashed(flow),self.config.encrypt(data),(self.s.now()+timedelta(minutes=10)).isoformat()))
        challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
        query=urlencode({'provider':'google','redirect_to':self.config.origin+'/api/v1/auth/google/callback','code_challenge':challenge,'code_challenge_method':'s256'})
        return {'url':self.config.supabase_url.rstrip('/')+'/auth/v1/authorize?'+query},flow
    def google_callback(self,flow,code):
        text_field(code,2048)
        with self.s.store.transaction():
            row=self.db.execute('SELECT * FROM auth_flows WHERE id=?',(hashed(flow or ''),)).fetchone()
            if not row or row['used'] or instant(row['expires_at'])<=self.s.now():raise DomainError('INVALID_AUTH_FLOW','انتهت محاولة تسجيل الدخول. حاول مجدداً.',401)
            data=self.config.decrypt(row['payload'])
            tokens=self.provider.call('POST','/token?grant_type=pkce',{'auth_code':code,'code_verifier':data['verifier']});user=self.provider.checked_user(tokens)
            mid=self._create_account(user,data['intent']);self.db.execute('UPDATE auth_flows SET used=1 WHERE id=?',(row['id'],))
            return self._new_session(mid,tokens,user['email'])
