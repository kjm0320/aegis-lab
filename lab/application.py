"""Tiny WSGI application with intentionally vulnerable and patched modes.

The lab is executed in-process, never listens on a socket, and only uses
synthetic records. The authenticated principal is injected by the test adapter;
it is NOT an HTTP header trusted from the caller and NOT a production login.
"""
import json
import sqlite3
from io import BytesIO
from urllib.parse import parse_qs, urlencode

ORDERS = {101: {"id": 101, "owner": "alice", "item": "Notebook"},
          202: {"id": 202, "owner": "bob", "item": "Private sample order"}}


class LabApplication:
    def __init__(self, patched=False):
        self.patched = patched

    def __call__(self, environ, start_response):
        path, method = environ.get("PATH_INFO", "/"), environ.get("REQUEST_METHOD", "GET")
        actor = environ.get("aegis.authenticated_user")
        headers = [("Content-Type", "application/json; charset=utf-8")]
        status, result = "404 Not Found", {"error": "not found"}
        if path.startswith("/api/orders/") and method == "GET":
            try:
                order = ORDERS.get(int(path.rsplit("/", 1)[-1]))
            except ValueError:
                order = None
            if actor not in ("alice", "bob"):
                status, result = "401 Unauthorized", {"error": "authentication required"}
            elif order is None:
                status, result = "404 Not Found", {"error": "not found"}
            elif self.patched and order["owner"] != actor:
                # Patch: enforce ownership after authentication and before disclosure.
                status, result = "403 Forbidden", {"error": "forbidden"}
            else:
                # Intentionally vulnerable mode skips the ownership authorization.
                status, result = "200 OK", order
        elif path == "/api/search" and method == "GET":
            term = parse_qs(environ.get("QUERY_STRING", ""), keep_blank_values=True).get("q", [""])[0]
            db = sqlite3.connect(":memory:")
            try:
                db.execute("CREATE TABLE products(id INTEGER, name TEXT, public INTEGER)")
                db.executemany("INSERT INTO products VALUES(?,?,?)", [(1,"Desk",1),(2,"Notebook",1),(3,"Internal sample",0)])
                if self.patched:
                    rows = db.execute("SELECT id,name FROM products WHERE public=1 AND name LIKE ?", ("%" + term + "%",)).fetchall()
                else:
                    # Educational vulnerability; this path must never serve real data.
                    rows = db.execute(f"SELECT id,name FROM products WHERE public=1 AND name LIKE '%{term}%'").fetchall()
                status, result = "200 OK", {"products": [{"id": r[0], "name": r[1]} for r in rows]}
            except sqlite3.Error:
                status, result = "400 Bad Request", {"error": "invalid query"}
            finally:
                db.close()
        elif path == "/session/refresh" and method == "POST":
            if actor not in ("alice", "bob"):
                status, result = "401 Unauthorized", {"error": "authentication required"}
            else:
                cookie = "lab_session=SYNTHETIC_ONLY; Path=/"
                if self.patched:
                    cookie += "; Secure; HttpOnly; SameSite=Lax"
                headers.append(("Set-Cookie", cookie))
                status, result = "200 OK", {"message": "synthetic cookie issued"}
        start_response(status, headers)
        return [json.dumps(result, ensure_ascii=False).encode("utf-8")]


def request(patched, path, actor=None, query=None, method="GET"):
    """Send a WSGI request inside this process. No DNS, TCP, HTTP client or server."""
    environ = {"PATH_INFO": path, "REQUEST_METHOD": method,
               "QUERY_STRING": urlencode(query or {}), "wsgi.input": BytesIO(),
               "wsgi.url_scheme": "https", "aegis.authenticated_user": actor}
    response = {}

    def start_response(status, headers):
        response.update(status=int(status.split()[0]), headers=dict(headers))

    response["body"] = json.loads(b"".join(LabApplication(patched)(environ, start_response)))
    return response
