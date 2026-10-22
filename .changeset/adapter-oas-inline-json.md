---
'@kubb/adapter-oas': patch
---

Parse an inline JSON `input` string with `JSON.parse` before falling back to the YAML parser, as file inputs already did. On a 1.9 MB JSON spec, parsing drops from about 700 ms to 40 ms and allocates about 550 MB less.
