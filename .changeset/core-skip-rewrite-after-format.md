---
'@kubb/core': patch
---

Stop rewriting the whole output tree on every build when `output.format` or `output.lint` is set.

The formatter and linter run over the output directory after the files are written, so the bytes on disk are theirs, not Kubb's. The unchanged-content check in the storage compared against what Kubb was about to write and therefore missed on every file, every run, which made watch mode re-trigger downstream file watchers over hundreds of unchanged modules.

The check now compares the trimmed text rather than the exact bytes, so trailing whitespace on disk is no longer a reason to rewrite a file. Generated files also end with a single newline now, matching what prettier, biome, and oxfmt all write, which leaves the formatter nothing to do on that count.

For formatters that also reflow code, Kubb records what each source turned into after the output passes in `node_modules/.cache/kubb/output-manifest.json` and consults it before writing, so a file the formatter already normalized is left alone. A file edited by hand or a changed source still fails the check and is rewritten.

Closes [#3859](https://github.com/kubb-labs/kubb/issues/3859)
