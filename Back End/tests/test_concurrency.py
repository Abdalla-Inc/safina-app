import threading
import unittest
import test_backend as support
from test_backend import uid,B
from safina.service import Service
from safina.store import Store
from safina.domain import DomainError,RULE_VERSION,REF

class ConcurrencyTests(unittest.TestCase):
    setUp=support.BackendCase.setUp
    tearDown=support.BackendCase.tearDown
    report=support.BackendCase.report
    log=support.BackendCase.log

def run_parallel(self,requests):
    barrier=threading.Barrier(2);results=[]
    def worker(op,body,id):
        st=Store(self.path);sv=Service(st,now=lambda:self.now)
        try:
            barrier.wait();results.append(sv.mutate('alice',op,body,id))
        except DomainError as e:results.append(e.code)
        finally:st.close()
    threads=[threading.Thread(target=worker,args=req) for req in requests]
    for t in threads:t.start()
    for t in threads:t.join(10);self.assertFalse(t.is_alive())
    return results

def test_concurrent_offline_retry(self):
    b=self.report();results=run_parallel(self,[('reading',b,None),('reading',b,None)])
    self.assertEqual(results[0],results[1]);self.assertEqual(len(self.s.state('alice')['acts']),1)

def test_concurrent_revision_one_wins(self):
    a=self.log()['act'];body={'mutationId':uid(),'expectedRevision':1,'reason':'correction','ranges':[{'start':'2:1','end':'2:10'}],'ruleVersion':RULE_VERSION,'referenceVersion':REF.version}
    other={**body,'mutationId':uid(),'ranges':[{'start':'2:1','end':'2:20'}]}
    results=run_parallel(self,[('correct',body,a['id']),('correct',other,a['id'])])
    self.assertEqual(results.count('REVISION_CONFLICT'),1);self.assertEqual(self.s.state('alice')['acts'][a['id']]['revision'],2)

ConcurrencyTests.test_concurrent_offline_retry=test_concurrent_offline_retry
ConcurrencyTests.test_concurrent_revision_one_wins=test_concurrent_revision_one_wins
