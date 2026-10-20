# Browser media idle protection

Keeps the automatic screensaver and lock away while a browser reports MPRIS playback.

- Watches playback signals, not a polling loop.
- Supports Chromium/Chrome, Brave, Firefox, Zen, LibreWolf, Floorp, Vivaldi, Opera and Edge.
- Reads browser identity and playback state only, not track titles or URLs.
- Browser audio also inhibits idle; MPRIS does not reliably distinguish video from audio.
- Standalone music players are excluded. Browsers must expose MPRIS for detection.
- Manual locking, manual Stay Awake and Wayland inhibition retain their original behavior.
- When playback stops after an idle interval, a fresh first idle timeout is allowed.

## Install

This repository contains one Omarchy shell plugin with `manifest.json` at its root.
From a normal desktop terminal, after this repository has been published:

```sh
omarchy plugin add https://github.com/Desert-sabaku/omarchy-browser-idle.git --enable
```

If already installed, update rather than adding a second copy:

```sh
omarchy plugin update dotfiles.idle
```

The plugin ID is `dotfiles.idle`. The existing ID is retained for compatibility with earlier dotfiles installations.
This is a clone of `omarchy.idle`; `clonedFrom` metadata lets Omarchy replace the stock service and restore it later.
Do not enable another replacement of the same service alongside it.

## Development and existing dotfiles users

An existing dotfiles checkout already links these files. It must **not** run `plugin add` over the same ID.
Update its pinned submodule and use the dotfiles installer instead. The optional `scripts/enable-browser-idle` helper
rescans plugins, backs up shell.json, and enables the plugin from a real desktop session; it attempts to
restore the stock service if its post-activation checks fail. No custom installer is required for new users.

## Disable / remove

```sh
omarchy plugin enable omarchy.idle
omarchy plugin remove dotfiles.idle
```

For a development checkout managed by dotfiles, switch to stock first and remove the corresponding managed
links through dotfiles instead of invoking `plugin remove` on a development checkout.

## Compatibility and validation

Based on installed Omarchy `4.0.6-1`. This fork uses shell internals; future compatibility is not guaranteed.
Requirements: Omarchy 4 / Quickshell and its usual dependencies. Developer tests additionally require Python 3 and Node.js.

```sh
omarchy plugin validate .
python3 -m unittest discover -s tests -v
```

Static validation and automated tests are available. A real desktop smoke test is still required before claiming
a verified release: confirm activation, normal operation, and restoration to the stock service.
No marketplace listing or approval is claimed. The GitHub repository must be created and pushed before
remote installation works.

## Upstream maintenance and license

Package updates are not merged automatically. Compare upstream changes against `upstream.json` before upgrading.
MIT; upstream copyright is retained in LICENSE. See THIRD_PARTY.md for attribution.

## Related work

[Omarchy issue #6475](https://github.com/omacom/omarchy/issues/6475) tracks browser inhibition failures.
A search index described `pxllbt/media-idle-inhibit` as a plugin for any MPRIS player, but its GitHub URL returned
404 during a 2026-10-21 review, so its current availability and implementation were not verified.
This plugin intentionally monitors browsers only. Prefer an upstream fix once it satisfies the same needs.
