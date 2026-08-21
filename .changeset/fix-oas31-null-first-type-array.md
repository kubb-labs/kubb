---
"@kubb/adapter-oas": patch
---

Fix an OpenAPI 3.1 multi-type array dropping every type when `null` came first. `type: ["null", "string"]` generated `null` instead of `string | null`, while the equivalent `type: ["string", "null"]` generated the right thing, so output depended on the order the types were written in. The normalized type now takes the first non-`null` entry, leaving `type: ["null"]` as a null schema.
