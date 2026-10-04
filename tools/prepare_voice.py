"""Prepare pinned browser-only speech assets. Never reads or uploads recordings."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'voice-assets'
REVISION = '5332fcc35e32a33b86612b9a57a89be7906102b1'
PACKAGE_URL = 'https://registry.npmjs.org/@huggingface/transformers/-/transformers-3.8.1.tgz'
PACKAGE_INTEGRITY = 'tsTk4zVjImqdqjS8/AOZg2yNLd1z9S5v+7oUPpXaasDRwEDhB+xnglK1k5cad26lL5/ZIaeREgWWy0bs9y9pPA=='
FILES = {
    'config.json': ('git', 'dea913aa8ec7d53db029e97c97a766d534c8da04'),
    'generation_config.json': ('git', '72e54ad7340e05287aa731f9d8556b5368be3fe0'),
    'preprocessor_config.json': ('git', '91876762a536a746d268353c5cba57286e76b058'),
    'tokenizer.json': ('git', '1e95340ff836fad1b5932e800fb7b8c5e6d78a74'),
    'tokenizer_config.json': ('git', 'd13b786c04765fb1a06492b53587752cd67665ea'),
    'onnx/encoder_model_quantized.onnx': ('sha256', 'fd9d995b9dcb0520f0dbf6cf68651af639fc385f594d9d876e69ca2802dc438e'),
    'onnx/decoder_model_merged_quantized.onnx': ('sha256', '6c0c125986b007d2e3734bec84c18bda0152071b90b87fadac6d7764499927a0'),
}

def read_url(url):
    with urlopen(url, timeout=60) as response:
        return response.read()

def matches(raw, kind, expected):
    actual = hashlib.sha256(raw).hexdigest() if kind == 'sha256' else hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    return actual == expected

def write(path, raw):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Replace only this explicitly named generated asset after verification.
    temporary = path.with_suffix(path.suffix + '.part')
    temporary.write_bytes(raw)
    temporary.replace(path)

def main():
    manifest = {'transformers_js': '3.8.1', 'model': 'Xenova/whisper-tiny', 'revision': REVISION, 'model_license': 'Apache-2.0 (ONNX conversion); original Whisper MIT', 'files': []}
    archive = read_url(PACKAGE_URL)
    if hashlib.sha512(archive).digest() != base64.b64decode(PACKAGE_INTEGRITY):
        raise ValueError('Runtime package integrity mismatch; stopped.')
    names = ['dist/transformers.min.js', 'dist/ort-wasm-simd-threaded.jsep.mjs', 'dist/ort-wasm-simd-threaded.jsep.wasm', 'LICENSE']
    with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as bundle:
        for name in names:
            raw = bundle.extractfile('package/' + name).read()
            output = DEST / 'vendor' / Path(name).name
            write(output, raw)
            manifest['files'].append({'path': output.relative_to(ROOT).as_posix(), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'source': PACKAGE_URL})
    for name, (kind, expected) in FILES.items():
        output = DEST / 'models/Xenova/whisper-tiny' / name
        raw = output.read_bytes() if output.is_file() else b''
        url = f'https://huggingface.co/Xenova/whisper-tiny/resolve/{REVISION}/{name}'
        if not matches(raw, kind, expected):
            print('Preparing:', name, flush=True)
            raw = read_url(url)
            if not matches(raw, kind, expected):
                raise ValueError(f'Model integrity mismatch: {name}; stopped.')
            write(output, raw)
        manifest['files'].append({'path': output.relative_to(ROOT).as_posix(), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'source': url})
    output = ROOT / 'data/voice-assets-manifest.json'
    write(output, (json.dumps(manifest, indent=2) + '\n').encode())
    print('Ready:', len(manifest['files']), 'verified assets;', round(sum(f['bytes'] for f in manifest['files']) / 1048576, 1), 'MiB. No audio was processed.')

if __name__ == '__main__':
    main()
