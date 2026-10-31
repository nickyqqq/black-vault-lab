"""Intentionally vulnerable, localhost-only fictional exchange training lab."""
import json
import secrets
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
TOTAL = 6_000_000_000


class Lab:
    def __init__(self):
        self.reset(False)

    def reset(self, patched=False, difficulty="normal"):
        self.difficulty = difficulty
        self.patched = patched
        self.token = 'LAB-ONLY-' + secrets.token_hex(8)
        self.session = None
        self.role = None
        self.balance = TOTAL
        self.loot = 0
        self.stage = 0
        self.events = ['Training environment initialized. All funds are fictional.']

    def state(self):
        return dict(difficulty=self.difficulty, patched=self.patched, balance=self.balance, loot=self.loot,
                    stage=self.stage, events=self.events[-30:], won=self.loot == TOTAL)

    def request(self, path, data):
        if path == '/api/reset':
            difficulty = data.get('difficulty', self.difficulty)
            if difficulty not in ('normal', 'hard'):
                return 400, {'error': 'Choose normal or hard.'}
            self.reset(data.get('patched') is True, difficulty)
            return 200, self.state()
        if path == '/api/artifact':
            if self.patched:
                self.events.append('BLOCKED: debug credential export disabled.')
                return 403, {'error': 'Patched: debug bundles contain no credentials.'}
            # BUG 1: debug export exposes a synthetic service credential.
            self.stage = max(self.stage, 1)
            self.events.append('Debug bundle accessed: service credential exposed.')
            return 200, {'file': 'devops-diagnostics.json', 'service': 'withdrawal-worker',
                         'token': self.token, 'assigned_role': 'observer',
                         'note': 'Lab API: POST /api/session accepts token and role.' if self.difficulty == 'normal' else 'Diagnostic export.'}
        if path == '/api/session':
            if data.get('token') != self.token:
                return 401, {'error': 'Invalid lab token. Inspect the debug artifact.'}
            # BUG 2: trusting the client role promotes a read-only identity.
            self.role = 'observer' if self.patched else data.get('role', 'observer')
            self.session = 'SESSION-' + secrets.token_hex(8)
            if self.role == 'withdrawal-admin':
                self.stage = max(self.stage, 2)
            self.events.append('Session created with role: ' + str(self.role))
            return 200, {'session': self.session, 'role': self.role}
        if path == '/api/withdraw':
            if not self.session or data.get('session') != self.session:
                return 401, {'error': 'A valid lab session is required.'}
            if self.role != 'withdrawal-admin':
                return 403, {'error': 'Requires withdrawal-admin role.'}
            if self.patched:
                return 403, {'error': 'Patched: independent server-side approval required.'}
            # BUG 3: client-controlled approval replaces an independent policy check.
            if data.get('approved') is not True:
                return 403, {'error': 'Approval missing. Read the vulnerable code.' if self.difficulty == 'normal' else 'Approval missing.'}
            amount = data.get('amount')
            if type(amount) is not int or not 0 < amount <= self.balance:
                return 400, {'error': 'Amount must be a positive integer within vault balance.'}
            if data.get('destination') != 'lab:player':
                return 400, {'error': 'Only the fictional destination lab:player exists.'}
            self.balance -= amount
            self.loot += amount
            self.stage = 3 if self.loot == TOTAL else self.stage
            self.events.append(f'Synthetic transfer: ${amount:,} to lab:player.')
            return 200, {'message': 'Simulated transfer recorded.', **self.state()}
        return 404, {'error': 'Unknown lab endpoint.'}


class Handler(BaseHTTPRequestHandler):
    lab = Lab()
    lock = threading.Lock()

    def log_message(self, *args):
        pass

    def send(self, status, body, content_type='application/json'):
        payload = json.dumps(body).encode() if content_type == 'application/json' else body
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(payload)

    def allowed(self):
        port = self.server.server_port
        hosts = {f'127.0.0.1:{port}', f'localhost:{port}'}
        origin = self.headers.get('Origin')
        return (self.client_address[0] == '127.0.0.1' and
                self.headers.get('Host') in hosts and
                (not origin or origin in {'http://' + h for h in hosts}) and
                self.headers.get('Sec-Fetch-Site') not in ('cross-site',))

    def do_GET(self):
        if not self.allowed():
            return self.send(403, {'error': 'Local requests only.'})
        if self.path == '/api/state':
            with self.lock:
                return self.send(200, self.lab.state())
        if self.path == '/source' and self.lab.difficulty == 'hard':
            return self.send(403, {'error': 'Source viewer disabled in Hard mode.'})
        files = {'/': ('index.html', 'text/html; charset=utf-8'),
                 '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
                 '/hq.js': ('hq.js', 'text/javascript; charset=utf-8'),
                 '/game.js': ('game.js', 'text/javascript; charset=utf-8'),
                 '/game.css': ('game.css', 'text/css; charset=utf-8'),
                 '/hq.css': ('hq.css', 'text/css; charset=utf-8'),
                 '/style.css': ('style.css', 'text/css; charset=utf-8'),
                 '/research': ('RESEARCH.md', 'text/plain; charset=utf-8'),
                 '/source': ('server.py', 'text/plain; charset=utf-8')}
        if self.path not in files:
            return self.send(404, {'error': 'Not found.'})
        name, kind = files[self.path]
        self.send(200, (ROOT / name).read_bytes(), kind)

    def do_POST(self):
        if not self.allowed():
            return self.send(403, {'error': 'Local requests only.'})
        if self.headers.get('Content-Type') != 'application/json':
            return self.send(415, {'error': 'Use application/json.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 8192:
                return self.send(413, {'error': 'Body must be 1–8192 bytes.'})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError()
        except (ValueError, json.JSONDecodeError):
            return self.send(400, {'error': 'Expected a JSON object.'})
        with self.lock:
            status, result = self.lab.request(self.path, data)
            self.send(status, result)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'BLACK VAULT — local lab at http://127.0.0.1:{server.server_port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
