---
'@kubb/adapter-oas': patch
---

Parse YAML specs faster with `@visulima/yaml`.

A YAML spec now goes through `@visulima/yaml` first, which parses about a third faster than `js-yaml`. A document it rejects still goes to `js-yaml`, so the result and the duplicate-key error stay the same.
