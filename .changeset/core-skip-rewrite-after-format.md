---
'@kubb/core': patch
---

Stop rewriting the whole output tree on every build when `output.format` or `output.lint` is set.

The formatter and linter run over the output directory after the files are written, so the bytes on disk are theirs, not Kubb's. The unchanged-content check in the storage compared against what Kubb was about to write and therefore missed on every file, every run, which made watch mode re-trigger downstream file watchers over hundreds of unchanged modules.

Generated files now end with a single newline, matching what prettier, biome, and oxfmt all write. For formatters that also reflow code, Kubb records what each source turned into after the output passes in `node_modules/.cache/kubb/output-manifest.json` and consults it before writing, so a file the formatter already normalized is left alone. A file edited by hand or a changed source still fails the check and is rewritten.

Closes [#3859](https://github.com/kubb-labs/kubb/issues/3859)
