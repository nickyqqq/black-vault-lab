import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from server import Handler, Lab, TOTAL


class GameTests(unittest.TestCase):
    def setUp(self):
        self.lab = Lab()

    def login(self, role='withdrawal-admin'):
        _, artifact = self.lab.request('/api/artifact', {})
        _, session = self.lab.request('/api/session', {'token': artifact['token'], 'role': role})
        return session['session']

    def withdraw(self, session, **overrides):
        data = dict(session=session, destination='lab:player', amount=TOTAL, approved=True)
        data.update(overrides)
        return self.lab.request('/api/withdraw', data)

    def test_full_heist_and_no_double_spend(self):
        session = self.login()
        status, result = self.withdraw(session)
        self.assertEqual(status, 200)
        self.assertTrue(result['won'])
        self.assertEqual((result['balance'], result['loot'], result['stage']), (0, TOTAL, 3))
        self.assertEqual(self.withdraw(session)[0], 400)

    def test_failures_preserve_ledger(self):
        self.assertEqual(self.withdraw('bad')[0], 401)
        observer = self.login('observer')
        self.assertEqual(self.withdraw(observer)[0], 403)
        session = self.login()
        self.assertEqual(self.withdraw(session, approved=False)[0], 403)
        self.assertEqual(self.withdraw(session, destination='external:address')[0], 400)
        for amount in [-1, 0, True, 1.5, '100', TOTAL+1]:
            self.assertEqual(self.withdraw(session, amount=amount)[0], 400)
        self.assertEqual(self.lab.balance, TOTAL)

    def test_partial_transfers(self):
        session = self.login()
        self.assertFalse(self.withdraw(session, amount=1)[1]['won'])
        self.assertTrue(self.withdraw(session, amount=TOTAL-1)[1]['won'])

    def test_reset_invalidates_credentials(self):
        token = self.lab.token
        session = self.login()
        self.lab.reset()
        self.assertEqual(self.withdraw(session)[0], 401)
        self.assertEqual(self.lab.request('/api/session', {'token':token})[0], 401)

    def test_patched_export(self):
        self.lab.reset(True)
        self.assertEqual(self.lab.request('/api/artifact', {})[0], 403)

    def test_patched_role_independently(self):
        self.lab.reset(True)
        status, result = self.lab.request('/api/session', {'token':self.lab.token, 'role':'withdrawal-admin'})
        self.assertEqual(result['role'], 'observer')
        self.assertEqual(self.withdraw(result['session'])[0], 403)

    def test_patched_approval_independently(self):
        self.lab.reset(True)
        self.lab.role, self.lab.session = 'withdrawal-admin', 'test-session'
        self.assertEqual(self.withdraw('test-session')[0], 403)
        self.assertEqual(self.lab.balance, TOTAL)


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Handler.lab = Lab()
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path='/', method='GET', body=None, headers=None):
        c = http.client.HTTPConnection('127.0.0.1', self.server.server_port)
        c.request(method, path, body, headers or {})
        r = c.getresponse()
        result = r.status, r.read(), dict(r.getheaders())
        c.close()
        return result

    def test_static_allowlist_and_headers(self):
        for path in ['/', '/app.js', '/style.css', '/source', '/research']:
            status, body, headers = self.request(path)
            self.assertEqual(status, 200)
            self.assertTrue(body)
            self.assertIn("frame-ancestors 'none'", headers['Content-Security-Policy'])
        for path in ['/../server.py', '/.git/config', '/.env']:
            self.assertEqual(self.request(path)[0], 404)

    def test_browser_containment(self):
        for headers in [{'Host':'evil.example'}, {'Origin':'https://evil.example'}, {'Sec-Fetch-Site':'cross-site'}]:
            self.assertEqual(self.request(headers=headers)[0], 403)
        self.assertEqual(self.request('/api/reset','POST','{}',{'Content-Type':'text/plain'})[0],415)

    def test_invalid_json(self):
        for body in ['[]', 'null', '{']:
            self.assertEqual(self.request('/api/reset','POST',body,{'Content-Type':'application/json'})[0],400)

    def test_http_heist(self):
        def post(path, data):
            status, body, _ = self.request(path, 'POST', json.dumps(data), {'Content-Type':'application/json'})
            self.assertEqual(status, 200)
            return json.loads(body)
        post('/api/reset', {})
        token=post('/api/artifact', {})['token']
        session=post('/api/session', {'token':token,'role':'withdrawal-admin'})['session']
        result=post('/api/withdraw',dict(session=session, destination='lab:player',amount=TOTAL,approved=True))
        self.assertTrue(result['won'])


if __name__ == '__main__':
    unittest.main()
