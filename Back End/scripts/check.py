"""Single local/CI verification command; stores the actual output for founder review."""
import subprocess
import sys
from safina.domain import ROOT

def main():
    checks=[['-m','unittest','discover','-s','tests','-v'],['scripts/build_reference.py']]
    output=[];failed=False
    for args in checks:
        run=subprocess.run([sys.executable,*args],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        output.append('$ python3 '+' '.join(args)+'\n'+run.stdout)
        print(run.stdout,end='');failed|=run.returncode!=0
    (ROOT/'docs/TEST_OUTPUT.txt').write_text('\n'.join(output))
    return int(failed)
if __name__=='__main__':raise SystemExit(main())
