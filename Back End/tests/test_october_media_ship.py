import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
from safina.media import youtube_source,prepare_upload
from safina.ship_lifecycle import replay_maintenance
from safina.domain import DomainError

class OctoberMediaShipTests(unittest.TestCase):
    def test_confirmed_ship_math_clamps_each_day_and_replays_corrections(self):
        days=[dict(date='2026-10-01',closed=True,outcome='completed'),dict(date='2026-10-02',closed=True,outcome='missed')]
        self.assertEqual(replay_maintenance(100,days)['health'],97)
        self.assertEqual(replay_maintenance(0,[dict(date='2026-10-01',closed=True,outcome='missed'),dict(date='2026-10-02',closed=True,outcome='completed')])['health'],3)
        corrected=[{**d,'outcome':'completed'} for d in days]
        self.assertEqual(replay_maintenance(100,corrected)['health'],100)
        self.assertEqual(replay_maintenance(100,days),replay_maintenance(100,days))
    def test_ship_rejects_unknown_open_duplicate_unordered_days(self):
        for days in ([dict(date='2026-10-01',closed=False,outcome='missed')],[dict(date='2026-10-01',closed=True,outcome='unknown')],[dict(date='2026-02-30',closed=True,outcome='completed')],[dict(date='2026-10-01',closed=True,outcome='missed')]*2):
            with self.assertRaises(DomainError):replay_maintenance(100,days)
    def source(self,url):return dict(kind='youtube',url=url,rightsReviewed=True,embeddable=True,sourceTitle='Owner-reviewed title',sourceAuthor='Owner-supplied author',reviewedAt='2026-10-01T00:00:00Z')
    def test_youtube_normalizes_and_rejects_external_or_malformed_sources(self):
        # Synthetic ID only; no external video is requested or fabricated as teaching content.
        source=youtube_source(self.source('https://youtu.be/AbCdEf01234?si=ignored'))
        self.assertEqual(source['url'],'https://www.youtube.com/watch?v=AbCdEf01234');self.assertEqual(source['embedUrl'],'https://www.youtube.com/embed/AbCdEf01234')
        for url in ('https://youtube.com.evil.test/watch?v=AbCdEf01234','file:///tmp/video','https://youtube.com/watch?v=AbCdEf01234&v=OtherId1234','https://youtu.be/invalid','https://user@youtube.com/watch?v=AbCdEf01234'):
            with self.assertRaises(DomainError):youtube_source(self.source(url))
    def test_upload_failure_persists_failed_state_and_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/'input.mp4';source.write_bytes(b'not video');out=Path(tmp)/'prepared'
            with patch('safina.media.subprocess.run',return_value=SimpleNamespace(returncode=1,stdout=b'',stderr=b'invalid')):
                with self.assertRaises(DomainError):prepare_upload(source,out,'ffmpeg',True)
            self.assertEqual(json.loads((out/'manifest.json').read_text())['state'],'failed')
            with self.assertRaises(DomainError):prepare_upload(source,out,'ffmpeg',True)
            with self.assertRaises(DomainError):prepare_upload(source,Path(tmp)/'other','ffmpeg',False)

    def test_new_video_sources_require_review_and_keep_access_checks(self):
        from safina.store import Store
        from safina.connected import ConnectedService
        from safina.identity import Identity,Config
        from safina.learning import Learning
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/'db');s=ConnectedService(store);config=Config(b'x'*48);identity=Identity(s,config)
            identity.register(dict(email='video@example.test',password='safe-test-password',displayName='test',tier='B',countryCode='AU',istighfarGoal=100,communityAcknowledged=True));mid=store.db.execute('SELECT member_id FROM accounts').fetchone()[0];learning=Learning(s,config)
            asset=dict(storageBucket='private',storagePath='reviewed/thumbnail.jpg',rightsReviewed=True)
            lesson=dict(id='lesson',title='Test source only',required=True,thumbnail=asset,durationSeconds=1,video=self.source('https://youtu.be/AbCdEf01234'),resources=[],captions=[dict(id='ar',language='ar',label='العربية',asset={**asset,'storagePath':'reviewed/captions.vtt'})],completionPolicy='member_confirmation',completionPolicyApproved=True)
            course=dict(id='media-fixture',version=1,title='Synthetic source fixture',format='single_class',thumbnail=asset,free=False,sandbox=True,published=True,rightsReviewed=True,editorialReviewed=True,modules=[dict(id='module',title='test',lessons=[lesson],questions=[])])
            learning.publish_course(course)
            with self.assertRaises(DomainError):learning.lesson_detail(mid,course['id'],'lesson')
            with self.assertRaises(DomainError):learning.caption_url(mid,course['id'],'lesson','ar')
            with self.assertRaises(DomainError):learning.thumbnail_url(mid,course['id'])
            store.db.execute("INSERT INTO enrollments VALUES(?,?,?,NULL)",(mid,course['id'],'active'))
            detail=learning.lesson_detail(mid,course['id'],'lesson');self.assertEqual(detail['playback']['kind'],'youtube');self.assertTrue(detail['thumbnail'].startswith('/api/v1/'))
            self.assertNotIn('storageBucket',json.dumps(detail));self.assertEqual(len(detail['captions']),1)
            with self.assertRaises(DomainError):learning.validate_video(dict(kind='upload',storageBucket='private',storagePath='video.mp4',rightsReviewed=True,processingState='processing',mimeType='video/mp4',sizeBytes=200,sha256='a'*64,durationSeconds=1),True)
            store.close()
