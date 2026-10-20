import http.server, os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        name = os.path.basename(self.path.split("/save/")[-1])
        if not name.endswith(".png") or not name.startswith("moon-"):
            self.send_response(400)
            self.end_headers()
            return
        n = int(self.headers.get("Content-Length", 0))
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(self.rfile.read(n))
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")


http.server.ThreadingHTTPServer(("127.0.0.1", 8124), H).serve_forever()
