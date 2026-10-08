"""Standard-library bootstrap: run this with the existing Python, not the training venv."""
import argparse
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parent
ENV = ROOT / '.venv'
PYTHON = ENV / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')

def run(command, **kwargs):
    subprocess.run(command, check=True, cwd=ROOT, **kwargs)

def setup(server=False):
    if sys.version_info[:2] != (3, 12):
        raise RuntimeError('Bộ đã kiểm thử cần Python 3.12. Hãy chọn interpreter Python 3.12 trong VS Code.')
    if shutil.disk_usage(ROOT).free < 18 * 1024**3:
        raise RuntimeError('Cần tối thiểu 18 GB trống để cài thư viện, tải model và lưu checkpoint.')
    if not PYTHON.exists():
        print('Tạo môi trường Python riêng…', flush=True)
        venv.EnvBuilder(with_pip=True).create(ENV)
    requirement_files = ['requirements.lock.txt'] if (ROOT / 'requirements.lock.txt').exists() else ['requirements-train.txt'] + (['requirements-server.txt'] if server else [])
    expected = {'torch': '2.14.1+cu130'}
    for filename in requirement_files:
        for line in (ROOT / filename).read_text().splitlines():
            if not line.strip() or line.startswith('#'):
                continue
            name, version = line.split('==')
            expected[name] = version
    check = 'import importlib.metadata as m,json; print(json.dumps({x:m.version(x) for x in ' + repr(list(expected)) + '}))'
    result = subprocess.run([str(PYTHON), '-c', check], capture_output=True, text=True, cwd=ROOT)
    if result.returncode or json.loads(result.stdout) != expected:
        print('Cài bộ thư viện cố định (lần đầu có thể tải vài GB)…', flush=True)
        run([str(PYTHON), '-m', 'pip', 'install', '--disable-pip-version-check', 'torch==2.14.1+cu130', '--index-url', 'https://download.pytorch.org/whl/cu130'])
        for filename in requirement_files:
            run([str(PYTHON), '-m', 'pip', 'install', '--disable-pip-version-check', '-r', filename])
        run([str(PYTHON), '-m', 'pip', 'check'])

def main():
    parser = argparse.ArgumentParser(description='Neural-Lingua: chạy tự động trong VS Code')
    parser.add_argument('mode', nargs='?', default='train', choices=['setup', 'train', 'smoke', 'resume', 'serve', 'evaluate'])
    parser.add_argument('--run-dir', help='Thư mục kết quả để tiếp tục/đánh giá/thử')
    parser.add_argument('--experimental', action='store_true', help='Cho phép thử adapter chưa nghiệm thu trên máy local')
    args = parser.parse_args()
    if args.run_dir:
        args.run_dir = str(Path(args.run_dir).resolve())
    os.environ.update(PYTHONUTF8='1', PYTHONIOENCODING='utf-8', HF_HOME=str(ROOT / '.cache' / 'huggingface'), HF_HUB_DISABLE_TELEMETRY='1', TOKENIZERS_PARALLELISM='false')
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    setup(server=args.mode == 'serve')
    if args.mode == 'setup':
        return
    command = [str(PYTHON), str(ROOT / ('server.py' if args.mode == 'serve' else 'pipeline.py'))]
    if args.mode != 'serve':
        command += [args.mode]
    if args.run_dir:
        command += ['--run-dir', args.run_dir]
    if args.experimental:
        command += ['--experimental']
    run(command)

if __name__ == '__main__':
    try:
        main()
    except (Exception, KeyboardInterrupt) as error:
        print('\nĐã dừng: ' + ('Bạn đã hủy.' if isinstance(error, KeyboardInterrupt) else str(error)), flush=True)
        print('Xem README của ai-tutor. Không đổi model hoặc chuyển train sang CPU tự động.', flush=True)
        sys.exit(1)
