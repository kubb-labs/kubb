---
'@kubb/adapter-oas': patch
---

Locate diagnostics in a spec through one index for YAML and JSON, built on the event stream of `js-yaml`, in place of the `yaml` document parser and a separate JSON scanner. On the 45 MB Microsoft Graph spec, `kubb generate` prints the same line and column about 15 s sooner and peaks about 460 MB lower. A 28 MB JSON spec with located diagnostics finishes about 0.7 s sooner and peaks about 60 MB higher.
