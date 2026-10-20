from pathlib import Path
import shutil
import subprocess
import unittest


class MediaIdleTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which('node'), 'Node.js is needed for the QML JavaScript tests')
    def test_playback_policy_and_qml_state_transitions(self):
        test = Path(__file__).with_suffix('.js')
        result = subprocess.run(['node', str(test)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
