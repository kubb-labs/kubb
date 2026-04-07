---
"@kubb/plugin-mcp": patch
---

Fix enum path parameters generating `z.string()` instead of `z.enum([...])` in `inputSchema`.

When an OpenAPI path parameter had an `enum` constraint, `zodExprFromSchemaNode` fell through to `z.string()`. String enums now generate `z.enum(["VALUE1", "VALUE2"])` and number/boolean enums generate `z.union([z.literal(...)])`.
