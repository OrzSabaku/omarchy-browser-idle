const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const directory = path.join(__dirname, '..');
const model = {};
vm.createContext(model);
vm.runInContext(fs.readFileSync(path.join(directory, 'MediaIdle.js'), 'utf8'), model);
const browser = (playing, name = 'org.mpris.MediaPlayer2.chromium.instance123') => ({dbusName: name, isPlaying: playing});
assert.equal(model.anyBrowserPlaying([browser(true)]), true);
assert.equal(model.anyBrowserPlaying([browser(false)]), false);
assert.equal(model.anyBrowserPlaying([browser(true, 'org.mpris.MediaPlayer2.firefox.instance1')]), true);
assert.equal(model.anyBrowserPlaying([browser(true, 'org.mpris.MediaPlayer2.brave.instance1')]), true);
assert.equal(model.anyBrowserPlaying([browser(false), browser(true)]), true);
assert.equal(model.anyBrowserPlaying([]), false);
assert.equal(model.anyBrowserPlaying([browser(true, 'org.mpris.MediaPlayer2.spotify')]), false);
assert.equal(model.anyBrowserPlaying([{identity: 'Music', trackTitle: 'Chrome video', isPlaying: true}]), false);

// Exercise the actual QML handler without needing a live graphical session.
const qml = fs.readFileSync(path.join(directory, 'Service.qml'), 'utf8');
function extract(name) {
  const start = qml.indexOf('function ' + name + '(');
  assert.notEqual(start, -1);
  let begin = qml.indexOf('{', start), level = 1, end = begin + 1;
  while (level) {
    if (qml[end] === '{') level++;
    if (qml[end] === '}') level--;
    end++;
  }
  return qml.slice(start, end);
}
let cancels = 0, restarts = 0;
const timer = {interval: 0, running: false, restart() {restarts++; this.running = true;}};
const root = {mediaPlayers: [browser(true)], browserMediaPlaying: false,
  idleEnabled: true, idleTimersEnabled: true, firstIdleTimeoutSeconds: 150,
  cancelIdleCycle() {cancels++; timer.running = false;}};
const context = {root, MediaIdle: model, browserResumeTimer: timer};
vm.createContext(context);
vm.runInContext(extract('syncBrowserPlayback'), context);
context.syncBrowserPlayback();
assert.equal(root.browserMediaPlaying, true);
assert.equal(cancels, 1);
assert.equal(restarts, 0);
root.mediaPlayers = [browser(false), browser(true)];
context.syncBrowserPlayback();
assert.equal(cancels, 1); // Another browser still plays: keep inhibition.
root.mediaPlayers = [];
context.syncBrowserPlayback();
assert.equal(root.browserMediaPlaying, false);
assert.equal(restarts, 1);
assert.equal(timer.interval, 150000); // No immediate lock on pause/exit.
root.mediaPlayers = [browser(true)];
context.syncBrowserPlayback();
root.idleEnabled = false; // User explicitly chose Stay Awake.
root.mediaPlayers = [];
context.syncBrowserPlayback();
assert.equal(restarts, 1); // Do not undo the manual setting.
root.browserMediaPlaying = true;
for (const name of ['startIdleCycle', 'launchScreensaver', 'lockSystem']) {
  vm.runInContext(extract(name), context);
  context[name](); // Must return before touching any timer or process.
}
console.log('PASS: browser detection, pause/exit grace, multiple players, manual Stay Awake, timeout suppression');
