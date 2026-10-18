---
'@kubb/cli': minor
'@kubb/core': minor
---

`kubb generate --dry-run` shows a bar of new, changed, removed and unchanged files, then lists what it would change on disk (with line counts), compared the way a real write compares them. `kubb update --dry-run` replaces `--check`: it lists the available updates and installs nothing. `--check` still works with a deprecation warning. `@kubb/core` exports `createOutputManifest`.
