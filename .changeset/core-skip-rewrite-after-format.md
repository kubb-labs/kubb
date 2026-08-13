---
'@kubb/core': patch
---

Stop rewriting every generated file on each build when `output.format` or `output.lint` is set.

The formatter runs over the output directory after the files are written and ends each one with a newline. The unchanged-content check compared the exact bytes against what Kubb was about to write, so it missed on that single byte for every file, on every run. In watch mode that made downstream file watchers re-run over hundreds of unchanged modules.

The check now compares the trimmed text, so trailing whitespace is no longer a reason to rewrite a file, and generated files end with a newline the way prettier, biome, and oxfmt all write them.

A formatter configured in a style Kubb does not emit (different quotes, semicolons, or print width) still reflows every file, and those rewrites remain.

Closes [#3859](https://github.com/kubb-labs/kubb/issues/3859)
