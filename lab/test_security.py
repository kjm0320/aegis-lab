import unittest
from http.cookies import SimpleCookie
from lab.application import request


class AccessControlTests(unittest.TestCase):
    def test_vulnerable_cross_user_order_is_disclosed(self):
        r = request(False, "/api/orders/202", actor="alice")
        self.assertEqual(r["status"], 200)
        self.assertEqual(r["body"]["owner"], "bob")

    def test_patch_blocks_cross_user_access_and_body_leak(self):
        r = request(True, "/api/orders/202", actor="alice")
        self.assertEqual(r["status"], 403)
        self.assertNotIn("owner", r["body"])
        self.assertNotIn("item", r["body"])

    def test_owner_access_preserved_in_both_versions(self):
        for patched in (False, True):
            self.assertEqual(request(patched, "/api/orders/101", actor="alice")["status"], 200)
            self.assertEqual(request(patched, "/api/orders/202", actor="bob")["status"], 200)

    def test_missing_or_unknown_identity_denied(self):
        for patched in (False, True):
            for actor in (None, "mallory"):
                self.assertEqual(request(patched, "/api/orders/101", actor=actor)["status"], 401)

    def test_missing_or_malformed_order_is_not_found(self):
        for path in ("/api/orders/999", "/api/orders/not-an-id"):
            self.assertEqual(request(True, path, actor="alice")["status"], 404)


class SQLInjectionTests(unittest.TestCase):
    PAYLOAD = "%' OR 1=1 --"

    def test_vulnerable_predicate_exposes_hidden_fixture(self):
        r = request(False, "/api/search", query={"q": self.PAYLOAD})
        self.assertEqual(r["status"], 200)
        self.assertIn(3, [p["id"] for p in r["body"]["products"]])

    def test_parameterized_query_treats_payload_as_data(self):
        r = request(True, "/api/search", query={"q": self.PAYLOAD})
        self.assertEqual(r["status"], 200)
        self.assertEqual(r["body"]["products"], [])

    def test_regular_search_preserved(self):
        for patched in (False, True):
            self.assertEqual(request(patched, "/api/search", query={"q": "Desk"})["body"], {"products": [{"id": 1, "name": "Desk"}]})

    def test_quotes_do_not_cause_database_error_after_patch(self):
        r = request(True, "/api/search", query={"q": "O'Reilly"})
        self.assertEqual(r["status"], 200)
        self.assertEqual(r["body"]["products"], [])

    def test_empty_search_still_excludes_nonpublic_data(self):
        for patched in (False, True):
            self.assertEqual([p["id"] for p in request(patched, "/api/search")["body"]["products"]], [1, 2])


class CookieTests(unittest.TestCase):
    def cookie(self, patched):
        cookie = SimpleCookie()
        cookie.load(request(patched, "/session/refresh", actor="alice", method="POST")["headers"]["Set-Cookie"])
        return cookie["lab_session"]

    def test_vulnerable_cookie_lacks_protective_attributes(self):
        c = self.cookie(False)
        self.assertFalse(c["secure"])
        self.assertFalse(c["httponly"])
        self.assertEqual(c["samesite"], "")

    def test_patch_sets_secure_httponly_and_samesite(self):
        c = self.cookie(True)
        self.assertTrue(c["secure"])
        self.assertTrue(c["httponly"])
        self.assertEqual(c["samesite"], "Lax")

    def test_path_and_success_response_preserved(self):
        self.assertEqual(self.cookie(True)["path"], "/")
        self.assertEqual(request(True, "/session/refresh", actor="alice", method="POST")["status"], 200)

    def test_anonymous_refresh_does_not_issue_cookie(self):
        for patched in (False, True):
            r = request(patched, "/session/refresh", method="POST")
            self.assertEqual(r["status"], 401)
            self.assertNotIn("Set-Cookie", r["headers"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
