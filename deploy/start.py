"""Supervise loopback API and static reverse proxy; fail together, terminate cleanly."""
import os,signal,subprocess,sys,time
from pathlib import Path

# A public container must never expose test identities.
if os.environ.get('SAFINA_AUTH_MODE')!='supabase':
    raise SystemExit('Public deployment requires SAFINA_AUTH_MODE=supabase and a fresh live database.')
os.umask(0o077)
Path('/data').mkdir(exist_ok=True)
children=[]
def stop(*_):
    for child in children:
        if child.poll() is None:child.terminate()
    for child in children:
        try:child.wait(timeout=10)
        except subprocess.TimeoutExpired:child.kill();child.wait()
    raise SystemExit(0)
signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
try:
    children.append(subprocess.Popen([sys.executable,'-m','safina.connected_cli','--db','/data/live.sqlite3','serve','--port','8766']))
    children.append(subprocess.Popen(['caddy','run','--config','/app/Caddyfile','--adapter','caddyfile']))
    while all(child.poll() is None for child in children):time.sleep(.5)
    code=next(child.returncode for child in children if child.poll() is not None)
    for child in children:
        if child.poll() is None:child.terminate()
    for child in children:child.wait(timeout=10)
    raise SystemExit(code or 1)
finally:
    for child in children:
        if child.poll() is None:child.kill();child.wait()
