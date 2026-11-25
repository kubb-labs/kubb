---
'@kubb/cli': patch
---

Fix `kubb generate --check` exiting with 2 when an ignore rule skips its temporary folder, such as `ignorePatterns` in `.oxlintrc.json` or `/.kubb-check-*/` in `.gitignore`.

`--check` now runs `output.format` and `output.lint` on the real `output.path`, so ignore rules and path overrides apply as they do in a plain `kubb generate`. It moves your files aside for that step and puts them back when the tools finish.
