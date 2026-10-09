import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = "/tmp/file_attachments/tcc_softeare base test"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving local test page at http://localhost:{PORT}")
        httpd.serve_forever()
