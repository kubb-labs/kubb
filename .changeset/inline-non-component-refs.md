---
"@kubb/adapter-oas": patch
---

A `$ref` to a path outside `components.schemas`, such as `#/paths/~1foo/get/responses/200/content/application~1json/schema/items`, is now inlined. Before, it was named after its last segment and imported from a file that was never generated, so the output failed to compile.
