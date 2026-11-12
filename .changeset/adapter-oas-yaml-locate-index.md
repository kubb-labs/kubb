---
'@kubb/adapter-oas': patch
---

Locate diagnostics without parsing the spec a second time. On a 45 MB YAML spec, `kubb generate` prints the same locations about 16 s sooner and peaks about 620 MB lower. A large JSON spec peaks about 70 MB higher.
