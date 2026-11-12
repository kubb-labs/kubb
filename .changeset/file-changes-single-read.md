---
'@kubb/cli': patch
'@kubb/core': patch
---

`kubb generate` no longer reads the whole output folder into memory to print the "File changes" summary. Each file is read once, by the write that decides whether to change it, and the summary counts from that read. With `output.clean`, the old files are fingerprinted one at a time right before the folder is emptied. On a rerun of the Cloudflare spec this cuts peak memory by 45 to 125 MB and the run by about 1 second. The summary and what reporters receive are unchanged. `--dry-run` and runs with `output.format`, `output.lint` or `output.postGenerate` still compare against the output read back at the end.

`kubb:file:processed` has a new `stored` field: what the storage held at that path before the write, or `null` when the path was missing or `output.clean` just emptied its folder.
