---
'@kubb/core': patch
---

Fire `kubb:files:processing:update` as files finish writing, instead of once after the last write. The rows keep input order and a 1..N counter, so the `kubb generate` progress bar now fills while files are written.
