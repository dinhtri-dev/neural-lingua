"""Build a fail-closed static course. No server, environment or training data.

Only the explicit allowlist is published. Voice assets are checked against the
committed manifest, including size and SHA-256. Previous builds are retained,
never recursively deleted. The source checkout is not rewritten by this tool.
"""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import subprocess
import tarfile
import tempfile
from urllib.request import urlopen
import uuid

ROOT = Path(__file__).resolve().parents[1]
VERSION = '3.8.1'
REVISION = '5332fcc35e32a33b86612b9a57a89be7906102b1'
PACKAGE = f'https://registry.npmjs.org/@huggingface/transformers/-/transformers-{VERSION}.tgz'
INTEGRITY = 'tsTk4zVjImqdqjS8/AOZg2yNLd1z9S5v+7oUPpXaasDRwEDhB+xnglK1k5cad26lL5/ZIaeREgWWy0bs9y9pPA=='
VENDOR = ('transformers.min.js', 'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm', 'LICENSE')
MODEL = ('config.json', 'generation_config.json', 'preprocessor_config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx')
VOICE_PATHS = {f'voice-assets/vendor/{n}' for n in VENDOR} | {f'voice-assets/models/Xenova/whisper-tiny/{n}' for n in MODEL}
PUBLIC_FILES = ('index.html', 'styles.css', 'js/app.js', 'js/dom.js', 'js/course.js', 'js/store.js', 'js/personalization.js', 'js/personalization-view.js', 'js/translator.js', 'js/voice.js', 'js/voice-worker.js', 'js/voice-integrity.js', 'js/site-mode.js', 'data/course.json', 'data/voice-assets-manifest.json')
EXTRAS = {'deploy/_headers': '_headers', 'deploy/404.html': '404.html'}

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def checked_path(root, relative):
    path = PurePosixPath(relative)
    if path.is_absolute() or '\\' in relative or any(p in ('', '.', '..') for p in path.parts):
        raise ValueError('Unsafe package path')
    target = root / relative
    for part in (target, *target.parents):
        if part == root.parent:
            break
        if part.is_symlink() or part.is_junction():
            raise ValueError('Links/junctions are not accepted in a public build')
    if target.resolve() != root.resolve() / relative:
        raise ValueError('Path escapes build root')
    return target

def manifest(root):
    data = json.loads(checked_path(root, 'data/voice-assets-manifest.json').read_text(encoding='utf-8'))
    if data.get('transformers_js') != VERSION or data.get('model') != 'Xenova/whisper-tiny' or data.get('revision') != REVISION:
        raise ValueError('Unsupported voice version/revision')
    files = data.get('files', [])
    if len(files) != len(VOICE_PATHS) or {f.get('path') for f in files} != VOICE_PATHS:
        raise ValueError('Voice manifest is not the exact approved allowlist')
    for entry in files:
        path = entry['path']
        expected_source = PACKAGE if path.startswith('voice-assets/vendor/') else f'https://huggingface.co/Xenova/whisper-tiny/resolve/{REVISION}/' + path.split('whisper-tiny/', 1)[1]
        if entry.get('source') != expected_source or type(entry.get('bytes')) is not int or not 0 < entry['bytes'] <= 40 * 1024 * 1024:
            raise ValueError('Invalid voice asset metadata')
        h = entry.get('sha256', '')
        if len(h) != 64 or any(c not in '0123456789abcdef' for c in h):
            raise ValueError('Invalid voice checksum')
    return data

def verify(raw, entry):
    if len(raw) != entry['bytes'] or digest(raw) != entry['sha256']:
        raise ValueError(f"Voice integrity mismatch: {entry['path']}")
    return raw

def download(url, limit):
    with urlopen(url, timeout=90) as response:
        if not response.url.startswith('https://'):
            raise ValueError('Insecure asset redirect')
        raw = response.read(limit + 1)
    if len(raw) > limit:
        raise ValueError('Asset download exceeds limit')
    return raw

def voice_assets(root, data, offline=False):
    bundle = None
    for entry in data['files']:
        source = checked_path(root, entry['path'])
        if source.is_file():
            # A corrupt existing file is an error, not silently replaced.
            yield entry['path'], verify(source.read_bytes(), entry)
        elif offline:
            raise ValueError(f"Missing voice asset: {entry['path']}; prepare it or build without --offline")
        elif entry['path'].startswith('voice-assets/vendor/'):
            if bundle is None:
                raw = download(PACKAGE, 35 * 1024 * 1024)
                if hashlib.sha512(raw).digest() != base64.b64decode(INTEGRITY):
                    raise ValueError('Runtime package integrity mismatch')
                bundle = tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz')
            name = PurePosixPath(entry['path']).name
            member = bundle.getmember('package/' + ('LICENSE' if name == 'LICENSE' else 'dist/' + name))
            if not member.isfile() or member.size != entry['bytes']:
                raise ValueError('Unexpected runtime archive entry')
            yield entry['path'], verify(bundle.extractfile(member).read(), entry)
        else:
            yield entry['path'], verify(download(entry['source'], entry['bytes']), entry)
    if bundle:
        bundle.close()

def verify_build(directory):
    directory = directory.resolve()
    info = json.loads(checked_path(directory, 'build-manifest.json').read_text(encoding='utf-8'))
    if info.get('kind') != 'neural-lingua-public-v1' or not isinstance(info.get('files'), list):
        raise ValueError('Not a managed public build')
    expected = set(PUBLIC_FILES) | set(EXTRAS.values()) | VOICE_PATHS
    entries = info['files']
    if len(entries) != len(expected) or {e['path'] for e in entries} != expected:
        raise ValueError('Build manifest differs from the public allowlist')
    actual = {p.relative_to(directory).as_posix() for p in directory.rglob('*') if p.is_file()}
    if actual != expected | {'build-manifest.json'}:
        raise ValueError('Unexpected or missing public file')
    for entry in entries:
        verify(checked_path(directory, entry['path']).read_bytes(), entry)
    if info['package_sha256'] != digest(json.dumps(entries, sort_keys=True, separators=(',', ':')).encode()):
        raise ValueError('Build fingerprint mismatch')
    return info

def build(root=ROOT, offline=False):
    root = Path(root).resolve()
    data = manifest(root)
    output = checked_path(root, 'dist')
    if output.exists():
        if not output.is_dir():
            raise ValueError('dist must be a directory')
        verify_build(output)  # Refuse to move user files or a tampered old build.
    course = json.loads(checked_path(root, 'data/course.json').read_text(encoding='utf-8'))
    lessons = course.get('lessons', [])
    if len(lessons) != 52 or [l.get('number') for l in lessons] != list(range(1, 53)) or len({l.get('id') for l in lessons}) != 52:
        raise ValueError('Expected exactly 52 distinct ordered lessons')
    # Preflight all inputs before creating a staged output.
    content = {n: checked_path(root, n).read_bytes() for n in PUBLIC_FILES}
    content.update({dest: checked_path(root, src).read_bytes() for src, dest in EXTRAS.items()})
    content.update(voice_assets(root, data, offline))
    source_fingerprint = digest(json.dumps({n: digest(raw) for n, raw in sorted(content.items())}, sort_keys=True).encode())
    content['js/site-mode.js'] = b'export const PUBLIC_SITE = true;\n'
    app = content['js/app.js'].decode('utf-8')
    local_import = "import {tutorView} from './tutor.js';"
    if app.count(local_import) != 1:
        raise ValueError('Local tutor boundary changed; review public packaging')
    content['js/app.js'] = app.replace(local_import, "const tutorView = () => {throw new Error('Local-only feature');};").encode('utf-8')
    try:
        parent_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError, subprocess.CalledProcessError):
        parent_commit = None
    entries = [{'path': n, 'bytes': len(raw), 'sha256': digest(raw)} for n, raw in sorted(content.items())]
    info = {'kind': 'neural-lingua-public-v1', 'source_parent_commit': parent_commit, 'source_inputs_sha256': source_fingerprint, 'package_sha256': digest(json.dumps(entries, sort_keys=True, separators=(',', ':')).encode()), 'files': entries}
    staged = Path(tempfile.mkdtemp(prefix='.public-build-', dir=root))
    for name, raw in content.items():
        target = checked_path(staged, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
    (staged / 'build-manifest.json').write_text(json.dumps(info, indent=2) + '\n', encoding='utf-8')
    verify_build(staged)
    if output.exists():
        backup = checked_path(root, '.public-build-backup-' + uuid.uuid4().hex)
        output.rename(backup)
        print('Previous generated build retained:', backup.name)
    staged.rename(output)
    return info

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true', help='Verify local voice assets only; do not download')
    parser.add_argument('--verify', action='store_true', help='Verify existing dist without building')
    args = parser.parse_args()
    try:
        result = verify_build(ROOT / 'dist') if args.verify else build(offline=args.offline)
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(1, f'Public build stopped: {error}\n')
    print('Verified public package:', result['package_sha256'], ';', len(result['files']), 'files')
