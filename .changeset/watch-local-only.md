---
'@kubb/cli': minor
---

`kubb generate --watch` follows a local `input` file only and no longer polls a URL `input`. A URL or git input is generated once, with a warning, so rerun Kubb after the remote spec changes.
