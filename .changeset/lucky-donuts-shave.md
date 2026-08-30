---
'@kubb/cli': minor
---

`kubb init` adds plugins to an existing `kubb.config.ts` instead of only offering to overwrite it.

Running `kubb init --plugins plugin-zod` against a config you already edited now offers to merge:
the selected plugins and their imports are added to the existing `defineConfig(...)`, and your
input, output, and any code around it are left as they are. Overwriting is still available, and a
plugin already in the file is reported as skipped rather than added twice.

`kubb init --yes` merges instead of overwriting, so a non-interactive run no longer replaces a
config you wrote by hand.

`kubb studio` gains `--allowConfigEdit`, which lets Studio change plugin options in your
`kubb.config.ts`. It is asked for once per project like the other permissions, and stays off in CI.
