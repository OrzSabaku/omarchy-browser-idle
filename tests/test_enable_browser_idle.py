import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class EnableBrowserIdleTests(unittest.TestCase):
    def run_setup(self, reachable=True, confirmed=True):
        repo = Path(__file__).resolve().parents[1]
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        home, tools = root / 'home', root / 'bin'
        tools.mkdir()
        config = home / '.config/omarchy/shell.json'
        config.parent.mkdir(parents=True)
        config.write_text('{"idle":{"screensaver":150,"lock":300}}\n')
        marker = root / 'enables'
        (tools / 'omarchy-shell').write_text('''#!/bin/sh
if [ "$TEST_REACHABLE" != 1 ]; then exit 17; fi
if [ "$1" = idle ]; then
  if [ "$TEST_CONFIRMED" = 1 ]; then echo '{"browserMediaPlaying":false}'; else echo '{}'; fi
fi
''')
        (tools / 'omarchy').write_text('''#!/bin/sh
if [ "$2" = list ]; then echo '[{"id":"dotfiles.idle"}]'; fi
if [ "$2" = enable ]; then printf '%s\\n' "$3" >> "$TEST_MARKER"; fi
''')
        (tools / 'sleep').write_text('#!/bin/sh\nexit 0\n')
        for file in tools.iterdir():
            file.chmod(0o755)
        env = os.environ.copy()
        env.update(HOME=str(home), PATH=str(tools) + ':' + env['PATH'], TEST_MARKER=str(marker),
                   TEST_REACHABLE=str(int(reachable)), TEST_CONFIRMED=str(int(confirmed)))
        result = subprocess.run(['bash', str(repo / 'scripts/enable-browser-idle')],
                                env=env, text=True, capture_output=True, timeout=15)
        calls = marker.read_text().splitlines() if marker.exists() else []
        self.assertEqual(config.read_text(), '{"idle":{"screensaver":150,"lock":300}}\n')
        return result, calls, home

    def test_unreachable_desktop_leaves_stock_idle_untouched(self):
        result, calls, home = self.run_setup(reachable=False)
        self.assertEqual(result.returncode, 17)
        self.assertEqual(calls, [])
        self.assertFalse((home / '.local').exists())

    def test_verified_activation_keeps_clone(self):
        result, calls, home = self.run_setup()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(calls, ['dotfiles.idle'])
        self.assertEqual(len(list((home / '.local/state/omarchy-plugins/backups').glob('*/shell.json'))), 1)

    def test_failed_activation_restores_stock_service(self):
        result, calls, _ = self.run_setup(confirmed=False)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(calls, ['dotfiles.idle', 'omarchy.idle'])


if __name__ == '__main__':
    unittest.main()
