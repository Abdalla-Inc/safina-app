"""Pin metadata only; never import text, audio, fonts, or universal page numbers."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
primary = ROOT / 'data/sources/tanzil-metadata-1.0.xml'
cross = ROOT / 'data/sources/alquran-meta-2026-09-28.json'
r = ET.parse(primary).getroot()
x = json.loads(cross.read_text())['data']
counts = [int(s.attrib['ayas']) for s in r.find('suras')]
assert len(counts) == 114 and sum(counts) == 6236
assert counts == [s['numberOfAyahs'] for s in x['surahs']['references']]
def starts(section):
    return [f"{s.attrib['sura']}:{s.attrib['aya']}" for s in r.find(section)]
def cloud(section):
    return [f"{s['surah']}:{s['ayah']}" for s in x[section]['references']]
assert starts('juzs') == cloud('juzs') and len(starts('juzs')) == 30
assert starts('pages') == cloud('pages') and len(starts('pages')) == 604
out = {'version':'hafs-tanzil-1.0-20260928', 'verseCounts': counts,
       'juzStarts':starts('juzs'), 'pageMap':{'edition':'tanzil-medina-604',
       'version':'tanzil-pages-1.0', 'starts':starts('pages')},
       'provenance':{'primary':'https://tanzil.net/res/text/metadata/quran-data.xml',
       'primaryVersion':'1.0', 'primaryLicenseDeclared':r.attrib['license'],
       'primaryCopyright':r.attrib['copyright'],
       'primarySha256':hashlib.sha256(primary.read_bytes()).hexdigest(),
       'crossCheck':'https://api.alquran.cloud/v1/meta',
       'crossCheckSha256':hashlib.sha256(cross.read_bytes()).hexdigest(),
       'checkedAt':'2026-09-28', 'matchingSurahs':114,'matchingJuz':30,'matchingPages':604,
       'independenceLimit':'Separate published providers; underlying metadata may share Tanzil ancestry.',
       'textAvailable':False,'wordMapAvailable':False}}
(ROOT/'data/reference.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Validated 114 surahs, 6236 verses, 30 juz and 604 edition-specific page starts.')
