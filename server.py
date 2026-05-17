from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

PORT = 8000


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.wasm': 'application/wasm',
    }


if __name__ == '__main__':
    with TCPServer(('', PORT), Handler) as httpd:
        print(f'Serving at http://localhost:{PORT}')
        httpd.serve_forever()
