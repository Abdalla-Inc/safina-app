"""Staff-side media preparation and reviewed YouTube metadata. No member upload route."""
import hashlib,json,re,subprocess
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from .domain import DomainError,canonical
from .service import fields,text_field

def youtube_source(source):
    fields(source,['kind','url','rightsReviewed','embeddable','sourceTitle','sourceAuthor','reviewedAt'])
    if source['kind']!='youtube' or source['rightsReviewed'] is not True or type(source['embeddable']) is not bool:raise DomainError('MEDIA_NOT_REVIEWED','YouTube source and embedding permissions need review.')
    from .domain import instant
    instant(source['reviewedAt']);text_field(source['sourceTitle'],300);text_field(source['sourceAuthor'],300)
    u=urlsplit(source['url']);host=u.hostname;id=None
    if u.scheme!='https' or u.username or u.password or u.port:raise DomainError('INVALID_YOUTUBE_URL','Use an HTTPS YouTube video link.')
    if host=='youtu.be':id=u.path.strip('/')
    elif host in ('youtube.com','www.youtube.com','m.youtube.com'):
        if u.path=='/watch':
            values=parse_qs(u.query).get('v',[]);id=values[0] if len(values)==1 else None
        elif re.fullmatch(r'/(embed|shorts)/[^/]+',u.path):id=u.path.rsplit('/',1)[1]
    if not id or not re.fullmatch(r'[A-Za-z0-9_-]{11}',id):raise DomainError('INVALID_YOUTUBE_URL','Expected one canonical YouTube video ID.')
    return {**source,'videoId':id,'url':'https://www.youtube.com/watch?v='+id,'embedUrl':'https://www.youtube.com/embed/'+id}

def prepare_upload(input_path,output_dir,ffmpeg,rights_reviewed=False,captions=None):
    """Decode and transcode an owner-supplied local file before private storage upload.

    Restricted demuxers/protocols reject playlists and network sources. State is persisted
    before work begins; timeouts/decoder errors leave a failed manifest, never ready media.
    Output is never published and contains no automatic editorial approval.
    """
    if rights_reviewed is not True:raise DomainError('MEDIA_RIGHTS_NOT_APPROVED','Owner review is required before preparing an upload.')
    source=Path(input_path).resolve(strict=True)
    if not source.is_file() or source.suffix.lower() not in ('.mp4','.mov','.mkv','.webm') or not 0<source.stat().st_size<=2*1024**3:raise DomainError('INVALID_UPLOAD','Use a nonempty MP4, MOV, MKV or WebM file up to 2 GiB.')
    out=Path(output_dir);out.mkdir(parents=True,exist_ok=True)
    if any(out.iterdir()):raise DomainError('OUTPUT_EXISTS','Use a new empty output directory to preserve existing assets.',409)
    out.chmod(0o700);manifest={'state':'processing','rightsReviewed':True,'editorialReviewed':False,'sourceName':source.name}
    path=out/'manifest.json'
    def save():path.write_text(canonical(manifest)+'\n');path.chmod(0o600)
    save()
    def run(args):
        result=subprocess.run([str(ffmpeg),'-nostdin','-hide_banner','-loglevel','error','-xerror',*args],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=7200,check=False)
        if result.returncode:raise DomainError('MEDIA_PROCESSING_FAILED','The decoder rejected this file. No media was published.')
        return result.stdout.decode(errors='replace')
    try:
        fmt='mov' if source.suffix.lower() in ('.mp4','.mov') else 'matroska'
        video=out/'video.mp4';thumbnail=out/'thumbnail.jpg'
        progress=run(['-protocol_whitelist','file','-f',fmt,'-i',str(source),'-map','0:v:0','-map','0:a:0?','-map_metadata','-1','-t','14401','-vf','scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2','-c:v','libx264','-preset','medium','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart','-progress','pipe:1',str(video)])
        progress=run(['-protocol_whitelist','file','-f','mov','-i',str(video),'-map','0:v:0','-f','null','-progress','pipe:1','-'])
        if video.stat().st_size>2*1024**3:raise DomainError('OUTPUT_TOO_LARGE','Prepared video exceeds 2 GiB.')
        times=re.findall(r'out_time_ms=(\d+)',progress);duration=int(times[-1])/1000000 if times else 0
        if duration<=0 or duration>14400:raise DomainError('INVALID_DURATION','Video must be between zero and four hours long.')
        run(['-protocol_whitelist','file','-f','mov','-i',str(video),'-frames:v','1','-vf','scale=640:-2',str(thumbnail)])
        def artifact(p,mime):
            h=hashlib.sha256()
            with p.open('rb') as f:
                for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
            p.chmod(0o600);return {'file':p.name,'mimeType':mime,'sizeBytes':p.stat().st_size,'sha256':h.hexdigest()}
        manifest.update(state='ready',durationSeconds=duration,video=artifact(video,'video/mp4'),thumbnail=artifact(thumbnail,'image/jpeg'),captions=[])
        if captions:
            vtt=Path(captions)
            if vtt.stat().st_size>10*1024*1024:raise DomainError('INVALID_CAPTIONS','Caption file exceeds 10 MiB.')
            data=vtt.read_text(encoding='utf-8-sig')
            if not data.startswith('WEBVTT') or '-->' not in data or '<script' in data.lower():raise DomainError('INVALID_CAPTIONS','Supply reviewed UTF-8 WebVTT captions.')
            dest=out/'captions.vtt';dest.write_text(data);manifest['captions']=[artifact(dest,'text/vtt')]
        save();return manifest
    except BaseException:
        manifest['state']='failed';save();raise
