"""Guard the smoke -> clean training -> evaluation process boundaries."""
from pathlib import Path
import subprocess
import unittest
from unittest.mock import call, patch

from pipeline import isolated_stage, orchestrate


class LifecycleTests(unittest.TestCase):
    def test_train_passes_exact_worker_result_to_evaluation(self):
        smoke = Path('runs/smoke-result')
        trained = Path('runs/train-result')
        with patch('pipeline.isolated_stage', side_effect=[smoke, trained, None]) as stage:
            orchestrate('train')
        self.assertEqual(stage.call_args_list, [call('smoke'), call('train'), call('evaluate', trained)])

    def test_failed_smoke_never_starts_full_training(self):
        with patch('pipeline.isolated_stage', side_effect=RuntimeError('smoke failed')) as stage:
            with self.assertRaisesRegex(RuntimeError, 'smoke failed'):
                orchestrate('train')
        stage.assert_called_once_with('smoke')

    def test_resume_evaluates_only_the_resumed_run(self):
        selected = Path('runs/requested')
        with patch('pipeline.isolated_stage', side_effect=[selected, None]) as stage:
            orchestrate('resume', selected)
        self.assertEqual(stage.call_args_list, [call('resume', selected), call('evaluate', selected)])

    def test_worker_failure_propagates_without_reading_receipt(self):
        with patch('pipeline.subprocess.Popen') as launch, patch('pipeline.read_json') as read, patch('builtins.print'):
            launch.return_value.wait.return_value = 7
            with self.assertRaises(subprocess.CalledProcessError) as failure:
                isolated_stage('smoke')
        self.assertEqual(failure.exception.returncode, 7)
        read.assert_not_called()
        self.assertIn('--worker', launch.call_args.args[0])


if __name__ == '__main__':
    unittest.main()
