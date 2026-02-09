---
"@kubb/plugin-oas": patch
---

Fix optional file body parameter generation with anyOf containing binary and null

Fixed two issues in SchemaGenerator:
1. Changed `blob` keyword to use `unshift` instead of `push` to ensure it appears at index 0 when processing anyOf/oneOf unions
2. Added explicit handling for `type: null` in YAML (which becomes a null value in JSON) to prevent falling back to `unknown` type

This ensures that schemas with `anyOf: [{type: "string", format: "binary"}, {type: null}]` correctly generate `Blob | null` instead of just `null` or `Blob | unknown`.
