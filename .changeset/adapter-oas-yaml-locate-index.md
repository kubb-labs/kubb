---
'@kubb/adapter-oas': patch
---

Locate a diagnostic in a YAML spec without parsing the spec a second time. On the 45 MB Microsoft Graph spec, `kubb generate` prints the same line and column about 14 s sooner and peaks about 550 MB lower. YAML the new line index does not read, such as a flow collection or an anchor, still goes through the YAML parser.
