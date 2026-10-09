"""Start the preseeded synthetic demo on loopback."""
from safina.api import make_server
from safina.domain import ROOT

def main():
    folder=ROOT/'local'
    server=make_server(folder/'demo.sqlite3',port=8765,signing_key=(folder/'demo-signing-key').read_bytes())
    print('Synthetic Safina demo listening at http://127.0.0.1:8765',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
