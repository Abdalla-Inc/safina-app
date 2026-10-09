import hashlib
import json
import subprocess
import sys
import unittest
from pathlib import Path
from safina.contracts import validate
from safina.domain import ROOT,REF,DomainError

class ContractTests(unittest.TestCase):
    def test_all_consumer_fixtures_conform(self):
        paths=list((ROOT/'contracts/fixtures').glob('*.json'));self.assertGreaterEqual(len(paths),20)
        for p in paths:
            with self.subTest(fixture=p.name):
                x=json.loads(p.read_text());validate(x['fixture'],x['schema'])
    def test_all_seven_tiers_have_truthful_fixtures(self):
        for tier in ('B','BI','BJ1','BJ2','BJ3','BJ4','BJ5'):
            f=json.loads((ROOT/'contracts/fixtures'/f'today-{tier}.json').read_text())['fixture']
            self.assertEqual(f['assignment']['tier'],tier)
            if tier in ('BJ3','BJ4','BJ5'):self.assertEqual(f['assignment']['status'],'awaiting_policy')
    def test_pinned_sources_hashes_and_full_crosscheck(self):
        p=REF.data['provenance']
        self.assertEqual(hashlib.sha256((ROOT/'data/sources/tanzil-metadata-1.0.xml').read_bytes()).hexdigest(),p['primarySha256'])
        self.assertEqual(hashlib.sha256((ROOT/'data/sources/alquran-meta-2026-09-28.json').read_bytes()).hexdigest(),p['crossCheckSha256'])
        # Rebuild into identical pinned output, comparing every chapter, juz and page boundary.
        before=(ROOT/'data/reference.json').read_bytes()
        subprocess.run([sys.executable,str(ROOT/'scripts/build_reference.py')],check=True,capture_output=True)
        self.assertEqual(before,(ROOT/'data/reference.json').read_bytes())
    def test_contract_rejects_unknown_fields_and_false_as_credit(self):
        f=json.loads((ROOT/'contracts/fixtures/day-evaluation.json').read_text())['fixture']
        with self.assertRaises(DomainError):validate({**f,'dayCredit':False},'DayEvaluation')
        with self.assertRaises(DomainError):validate({'start':'2:1','end':'2:2','page':1},'Range')
    def test_required_model_contracts_exist(self):
        d=json.loads((ROOT/'contracts/schema.json').read_text())['$defs']
        for name in ('ProgramRule','QuranReferenceVersion','MushafPageMap','Commitment','CommitmentChange','Pause','MonthlySchedule','WeeklyCycle','AssignmentSnapshot','AssignmentSegment','ReaderTrace','ReadingAct','ReadingRevision','DayEvaluation','KhatmaRecord','ShipLedger','CalendarDay','ReminderPreference','SharingConsent','GroupPublication'):
            self.assertIn(name,d)
    def test_openapi_references_resolve(self):
        doc=json.loads((ROOT/'contracts/openapi.json').read_text());schemas=json.loads((ROOT/'contracts/schema.json').read_text())['$defs']
        def walk(x):
            if isinstance(x,dict):
                if '$ref' in x:self.assertIn(x['$ref'].split('/')[-1],schemas)
                for v in x.values():walk(v)
            elif isinstance(x,list):
                for v in x:walk(v)
        walk(doc)
