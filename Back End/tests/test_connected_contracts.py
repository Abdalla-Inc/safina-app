import json,unittest
from safina.domain import ROOT,DomainError
from safina.contracts import validate

class ConnectedContractTests(unittest.TestCase):
    def test_connected_fixtures_conform_without_relaxing_legacy(self):
        doc=json.loads((ROOT/'contracts/connected.schema.json').read_text())
        files=list((ROOT/'contracts/connected-fixtures').glob('*.json'));self.assertGreaterEqual(len(files),25)
        for path in files:
            x=json.loads(path.read_text())
            if x.get('administrativeInput'):continue
            with self.subTest(fixture=path.name):validate(x['fixture'],x['schema'],doc)
    def test_contract_rejects_profile_role_and_private_daily_email(self):
        doc=json.loads((ROOT/'contracts/connected.schema.json').read_text())
        with self.assertRaises(DomainError):validate({'mutationId':'00000000-0000-4000-8000-000000000000','expectedRevision':1,'role':'founder'},'ProfilePatch',doc)
        card=json.loads((ROOT/'contracts/connected-fixtures/daily-component.json').read_text())['fixture']['items'][0]
        card['member']['email']='not-public@example.test'
        with self.assertRaises(DomainError):validate(card,'DailyCard',doc)
    def test_connected_openapi_references_resolve(self):
        api=json.loads((ROOT/'contracts/connected.openapi.json').read_text());defs=json.loads((ROOT/'contracts/connected.schema.json').read_text())['$defs']
        def walk(x):
            if isinstance(x,dict):
                if '$ref' in x:self.assertIn(x['$ref'].split('/')[-1],defs)
                for v in x.values():walk(v)
            elif isinstance(x,list):
                for v in x:walk(v)
        walk(api);self.assertGreaterEqual(len(api['paths']),50)
