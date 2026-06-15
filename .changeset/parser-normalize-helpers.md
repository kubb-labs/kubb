---
"@kubb/adapter-oas": patch
---

Consolidate the OAS parser's per-site macro calls behind `applyShallow` and a `nameEnums` helper. Output is unchanged; the parser test suite stays byte-identical.
