---
'@kubb/cli': patch
'@kubb/core': patch
---

Make `kubb generate` up to 4 times faster on large specs that raise many diagnostics or write thousands of files.

- Index the spec once per run for diagnostic code frames, instead of splitting it into lines for every diagnostic. Cloudflare's 27.7 MB spec, with 239 deprecation notices, drops from 60 s to about 14 s.
- Count the "File changes" summary from each file as it is written, instead of reading the whole output back afterwards, and read the previous output while the plugins generate.
- Print only the start and end of the write in plain output, such as CI logs and piped runs, instead of one line per file. `--log-level verbose` still lists every file.
- Add the `kubb:file:processed` hook, which carries each file's source as it is handed to the storage.
