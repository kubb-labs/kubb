---
'@kubb/core': patch
---

Format only the files a run wrote. On a rerun, Prettier and Biome get just the changed files, and a run that writes nothing skips the formatter and the linter. On the Cloudflare spec (about 26,000 files) with Prettier, an unchanged rerun drops from about 85 s to about 20 s.
