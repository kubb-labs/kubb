---
'@kubb/adapter-oas': patch
---

Locate diagnostics in a spec through one compact index for YAML and JSON, in place of the `yaml` document parser and a separate JSON scanner. For a YAML input file, the index reuses the positions `js-yaml` found while loading it, so a located diagnostic does not parse the spec again. On the 45 MB Microsoft Graph spec, `kubb generate` prints the same line and column about 16 s sooner and peaks about 620 MB lower. A 28 MB JSON spec with located diagnostics finishes about 1 s sooner and peaks about 70 MB higher.
