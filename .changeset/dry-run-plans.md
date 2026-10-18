---
'@kubb/cli': minor
'@kubb/core': minor
---

`kubb generate --dry-run` lists what it would change on disk: new, changed (with line counts), removed, and unchanged files, compared the way a real write compares them. `kubb update --dry-run` replaces `--check`: it lists the available updates and installs nothing. `--check` still works with a deprecation warning. `@kubb/core` exports `createOutputManifest`.
