"""Run only 10 steps, then check the next stage has enough VRAM. No full train."""
import subprocess
import sys

from common import ROOT, digest, write_json
from pipeline import isolated_stage


def gpu_memory():
    output = subprocess.check_output([
        'nvidia-smi', '--query-gpu=memory.total,memory.used,memory.free',
        '--format=csv,noheader,nounits', '--id=0',
    ], text=True)
    total, used, free = [int(value.strip()) for value in output.strip().split(',')]
    return {'total_mib': total, 'used_mib': used, 'free_mib': free}


def main():
    before = gpu_memory()
    directory = isolated_stage('smoke')
    after_smoke = gpu_memory()
    # Exactly the preflight used before a full train, in a fresh process.
    subprocess.run([sys.executable, '-X', 'utf8', '-c', 'from pipeline import preflight; preflight()'], cwd=ROOT, check=True)
    after_preflight = gpu_memory()
    assert after_smoke['free_mib'] >= 3.5 * 1024
    assert after_preflight['free_mib'] >= 3.5 * 1024
    assert after_smoke['used_mib'] - before['used_mib'] < 256, 'VRAM không được trả sau smoke.'
    report = {
        'smoke_run': directory.name, 'before': before,
        'after_smoke': after_smoke, 'after_next_stage_preflight': after_preflight,
        'next_stage_preflight_passed': True, 'full_training_started': False,
        'source_sha256': {name: digest(ROOT / name) for name in [
            'pipeline.py', 'neural-lingua-ai.code-workspace', 'test_pipeline_lifecycle.py', 'verify_vram_lifecycle.py',
        ]},
    }
    write_json(ROOT / 'VRAM_FIX_VERIFICATION.json', report)
    print(report, flush=True)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
