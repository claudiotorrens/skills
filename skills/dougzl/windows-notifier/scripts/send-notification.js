const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function ensureNodeNotifierInstalled(skillDir) {
  const modulePath = path.join(skillDir, 'node_modules', 'node-notifier');
  if (fs.existsSync(modulePath)) return;

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['install', '--no-fund', '--no-audit'], {
    cwd: skillDir,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`npm install failed with exit code ${result.status ?? 'unknown'}`);
  }
}

(async () => {
  try {
    const skillDir = path.resolve(__dirname, '..');
    ensureNodeNotifierInstalled(skillDir);

    const notifier = require(path.join(skillDir, 'node_modules', 'node-notifier'));
    const args = parseArgs(process.argv);
    const title = args.title || 'OpenClaw 提醒';
    const message = args.message || '你有一条新的提醒。';
    const timeout = Number(args.timeout || 10);
    const wait = String(args.wait || 'false').toLowerCase() === 'true';
    const soundArg = String(args.sound || 'true').toLowerCase();
    const sound = !(soundArg === 'false' || soundArg === '0' || soundArg === 'off');

    notifier.notify({
      title,
      message,
      wait,
      timeout,
      appID: 'OpenClaw',
      appName: 'OpenClaw',
      sound,
    }, (error) => {
      if (error) {
        console.error('WINDOWS_NOTIFY_ERROR');
        console.error(error.message || String(error));
        process.exit(1);
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('WINDOWS_NOTIFY_ERROR');
    console.error(error?.message || String(error));
    process.exit(1);
  }
})();
