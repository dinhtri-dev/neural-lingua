"""Loopback-only static preview. No database, uploads, user accounts or API proxy."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT = Path(__file__).resolve().parent
CSP = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self'; connect-src 'self' https://translate.googleapis.com; frame-src https://learningenglish.voanews.com; img-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'"
class PreviewHandler(SimpleHTTPRequestHandler):
    server_version = "Neural-Lingua-Preview"
    sys_version = ""
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js':'text/javascript', '.mjs':'text/javascript', '.wasm':'application/wasm'}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def allowed(self):
        # Reject arbitrary Host values, including DNS rebinding to loopback.
        if self.headers.get('Host', '').lower() not in [f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}']:
            return False
        path = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        target = (ROOT / path).resolve()
        if not target.is_relative_to(ROOT) or any(part.startswith('.') for part in Path(path).parts):
            return False
        voice_vendor = path in ['voice-assets/vendor/transformers.min.js', 'voice-assets/vendor/ort-wasm-simd-threaded.jsep.mjs', 'voice-assets/vendor/ort-wasm-simd-threaded.jsep.wasm']
        voice_model = path.startswith('voice-assets/models/Xenova/whisper-tiny/') and path.removeprefix('voice-assets/models/Xenova/whisper-tiny/') in ['config.json', 'generation_config.json', 'preprocessor_config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx']
        return target.is_file() and (path in ['index.html','styles.css'] or path.startswith('js/') and path.endswith('.js') or path.startswith('data/') and path.endswith('.json') or voice_vendor or voice_model)
    def do_GET(self):
        if not self.allowed(): self.send_error(404, 'Not found'); return
        try:
            super().do_GET()
        except (ConnectionResetError, BrokenPipeError):
            # Cancelling model preparation can close a large download early.
            pass
    def do_HEAD(self):
        if not self.allowed(): self.send_error(404, 'Not found'); return
        super().do_HEAD()
    def do_POST(self): self.send_error(405, 'Method not allowed')
    def log_message(self, *args): pass
    def end_headers(self):
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','strict-origin-when-cross-origin')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Permissions-Policy','microphone=(self), camera=(), geolocation=()')
        self.send_header('Cache-Control','no-store')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Neural-Lingua local preview')
    parser.add_argument('--port', type=int, default=8831)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535: parser.error('Choose a port between 1024 and 65535')
    server = ThreadingHTTPServer(('127.0.0.1',args.port),PreviewHandler)
    print(f'Neural-Lingua: http://127.0.0.1:{args.port}',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: server.server_close()
