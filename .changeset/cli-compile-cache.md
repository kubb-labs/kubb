---
"kubb": patch
"@kubb/cli": patch
---

Make every `kubb` command start faster after its first run. The CLI turns on Node's compile cache, so later runs reuse the compiled code of Kubb and its plugins instead of compiling it again: about 35 ms off `kubb generate` on a small spec. The first run with an empty cache is about 100 ms slower while Node writes it. Node keeps the cache in `node-compile-cache` under the system temp directory, about 1 MB, and replaces an entry when the file it came from changes. Set `NODE_COMPILE_CACHE` to put it somewhere else, for example a folder your CI caches, or `NODE_DISABLE_COMPILE_CACHE=1` to turn it off.
