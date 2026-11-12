---
'@kubb/cli': patch
---

`kubb add --dry-run` and `kubb remove --dry-run` now stop after the preview instead of installing packages and editing `kubb.config.ts`. A config function receives the `reporters` selected with `--reporter`, and the `kubb studio snapshot` error names the `--package-version` flag.
