---
'@kubb/cli': patch
---

`kubb generate --watch` now says what each rebuild changed: the schemas and operations the spec gained or lost, and the files it added, modified, or removed. In an interactive terminal, press `r` to rebuild and `q` to quit. The update check and the config load now run while the banner plays, so the command starts faster.
