---
"@kubb/plugin-mcp": patch
---

Fix `inputSchema` generating `z.string()` instead of `z.enum([...])` for path parameters with an `enum` constraint in the OpenAPI spec.
