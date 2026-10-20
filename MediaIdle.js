// Only browser identity is inspected; do not read or log titles or URLs.
function isBrowser(player) {
  if (!player) return false
  var identity = [player.dbusName, player.identity, player.desktopEntry].join(" ").toLowerCase()
  return /(^|[^a-z])(firefox|librewolf|floorp|zen|chromium|chrome|brave|vivaldi|opera|msedge|microsoft-edge)([^a-z]|$)/.test(identity)
}

function anyBrowserPlaying(players) {
  for (var i = 0; i < players.length; i++) {
    if (players[i] && players[i].isPlaying && isBrowser(players[i])) return true
  }
  return false
}
