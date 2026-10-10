---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/studio': patch
---

Run `output.format`, `output.lint` and `output.postGenerate` commands through `tinyexec`, which resolves Windows command shims and the project's `node_modules/.bin`.

Formatter and linter detection for `'auto'` also finds a tool installed only in `node_modules/.bin` under `config.root`, the folder the tool then runs from. The browser opener and the `kubb studio start` background worker spawn through `tinyexec` too.
