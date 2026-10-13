"""Adversarial public-package tests; no network or deployment."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('public_build', ROOT / 'tools/build_public.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class PublicBuildTests(unittest.TestCase):
    def test_exact_package_and_local_source_unchanged(self):
        info = builder.verify_build(ROOT / 'dist')
        self.assertEqual(len(info['files']), 28)
        self.assertIn('false', (ROOT / 'js/site-mode.js').read_text())
        self.assertIn('true', (ROOT / 'dist/js/site-mode.js').read_text())
        self.assertFalse((ROOT / 'dist/js/tutor.js').exists())
        self.assertFalse((ROOT / 'dist/ai-tutor').exists())

    def test_tampered_asset_and_size(self):
        entry = {'path': 'test', 'bytes': 3, 'sha256': builder.digest(b'abc')}
        for raw in (b'bad', b'abcd'):
            with self.assertRaises(ValueError): builder.verify(raw, entry)

    def test_manifest_rejects_version_revision_path_and_duplicate(self):
        original = json.loads((ROOT / 'data/voice-assets-manifest.json').read_text())
        for change in ('version', 'revision', 'path', 'duplicate', 'source', 'size', 'hash'):
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory); (root / 'data').mkdir()
                data = json.loads(json.dumps(original))
                if change == 'version': data['transformers_js'] = 'latest'
                if change == 'revision': data['revision'] = 'main'
                if change == 'path': data['files'][0]['path'] = '../.env'
                if change == 'duplicate': data['files'][0] = data['files'][1]
                if change == 'source': data['files'][0]['source'] = 'http://attacker.test/file'
                if change == 'size': data['files'][0]['bytes'] = 100000000
                if change == 'hash': data['files'][0]['sha256'] = 'not-a-hash'
                (root / 'data/voice-assets-manifest.json').write_text(json.dumps(data))
                with self.assertRaises(ValueError): builder.manifest(root)

    def test_path_traversal(self):
        for name in ('../private', '/private', 'voice-assets/../../.env', 'js\\evil.js'):
            with self.assertRaises(ValueError): builder.checked_path(ROOT, name)

    def test_unmanaged_dist_never_moved_or_deleted(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); (root / 'data').mkdir(); (root / 'dist').mkdir()
            (root / 'data/voice-assets-manifest.json').write_bytes((ROOT / 'data/voice-assets-manifest.json').read_bytes())
            sentinel=root / 'dist/private.txt';sentinel.write_text('keep')
            with self.assertRaises(OSError): builder.build(root, offline=True)
            self.assertEqual(sentinel.read_text(), 'keep')

if __name__ == '__main__': unittest.main(verbosity=2)
