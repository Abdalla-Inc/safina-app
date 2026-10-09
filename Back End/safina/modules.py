"""Content schemas and draft persistence; no implied publication, grading or payments."""
from .domain import DomainError, gate
from .contracts import validate
from .service import fields, text_field

# Explicit contracts can be authored as drafts before curriculum and rights are settled.
DRAFT_FIELDS={
 'ClassroomCourse':('title','weeks','entitlementKey'),
 'ClassroomLesson':('courseId','week','sequence','title','sourceVideo','prerequisiteIds'),
 'LessonNotes':('lessonId','authorId','body','sourceVersion'),
 'SavedNote':('lessonId','noteVersion','body'),
 'Quiz':('lessonId','questions','gradingPolicyVersion'),
 'WrittenResponse':('lessonId','promptId','body'),
 'ClassroomAssignment':('lessonId','instructions','submissionKind'),
 'ClassroomFeedback':('responseId','authorId','body'),
 'LessonProgress':('lessonId','positionSeconds','completedComponents'),
 'MediaResource':('title','sourceUrl','provenance','rights','transcript','tags','review'),
 'Entitlement':('capability','validFrom','validUntil','grantSource','policyVersion'),
 'ReadingCircle':('name','moderationPolicyVersion','retentionPolicyVersion','chatEnabled'),
 'CircleMembership':('circleId','memberId','optInAt','revokedAt'),
 'SharingConsent':('circleId','memberId','audience','detailLevel','authorizedAt','revokedAt'),
 'GroupPublication':('circleId','actId','actRevision','consentId','publicationAuthorizationId','correctionPolicyVersion'),
 'CircleReaction':('publicationId','memberId','reaction'),
 'ModerationEvent':('circleId','actorId','action','reason'),
 'NotificationPreference':('circleId','memberId','enabled'),
 'Pause':('startDate','endDate','policyVersion'),
 'ListeningEvent':('sourceEdition','ranges','occurredAt'),
}

class Modules:
    def __init__(self,store):self.store=store
    def save_draft(self,kind,id,payload,revision=1,member=None):
        if kind not in DRAFT_FIELDS:raise DomainError('UNKNOWN_DRAFT_TYPE','Unsupported module draft.')
        fields(payload,DRAFT_FIELDS[kind])
        validate(payload,kind+'DraftInput')
        if kind=='ClassroomCourse' and payload['weeks']!=10:raise DomainError('INVALID_COURSE','The classroom contract contains ten weeks.')
        if kind=='ClassroomLesson' and (type(payload['week'])!=int or not 1<=payload['week']<=10 or type(payload['sequence'])!=int or payload['sequence']<1):raise DomainError('INVALID_LESSON','Week 1–10 and a positive sequence are required.')
        if kind=='LessonProgress' and (type(payload['positionSeconds']) not in (int,float) or not 0<=payload['positionSeconds']<=86400):raise DomainError('INVALID_PROGRESS','Invalid playback position.')
        if kind=='MediaResource':
            fields(payload['rights'],['host','embed','transcribe','redistribute'])
            if any(v not in ('unreviewed','permitted','denied') for v in payload['rights'].values()):raise DomainError('INVALID_RIGHTS','Every right needs a separate review state.')
            fields(payload['review'],['reviewerId','reviewedAt','transcriptVersion'])
        record={'id':id,'revision':revision,'status':'draft','publicationStatus':'blocked','data':payload}
        with self.store.transaction():
            prior=self.store.db.execute('SELECT max(revision) FROM records WHERE kind=? AND id=?',(kind,id)).fetchone()[0] or 0
            if revision!=prior+1:raise DomainError('REVISION_CONFLICT','Draft revision must follow its predecessor.',409,currentRevision=prior)
            self.store.record(kind,id,member,record,revision)
        return record
    def entitlements(self):
        return {'freeCapabilities':['reading','calendar','ship_accounting','dhikr'],'ads':False,
                'paidCapabilities':None,'status':'awaiting_policy','price':None}
    def publish(self,*args):gate('group_policy')
    def search(self,*args):gate('library_rights')
    def grade(self,*args):gate('classroom_policy')
