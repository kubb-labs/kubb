---
'@kubb/adapter-oas': patch
---

Locate diagnostics in a JSON spec without the YAML parser's event objects. On a 28 MB JSON spec, `kubb generate` prints the same locations and peaks about 170 MB lower.
