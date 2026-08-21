---
"@kubb/adapter-oas": patch
---

Fix an OpenAPI 3.1 multi-type array collapsing to a single type when combined with `format`. `type: ["null", "integer", "string"], format: "int32"` generated `integer | null`, dropping `string` entirely, because the `format` rule ran before the multi-type array had a chance to split into its per-type members. The multi-type rule now runs first, so each member (still carrying the original `format`) is parsed on its own and `int32 | null` correctly stays `integer | string | null` while other `format`-only schemas are unaffected.
