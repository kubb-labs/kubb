---
'@kubb/plugin-oas': patch
'@kubb/plugin-zod': patch
---

Fix `$ref` schemas with sibling `default` values not generating `.default()` in Zod output.

When an OpenAPI query parameter uses a `$ref` with a sibling `default` value (e.g. `{"$ref": "#/components/schemas/ProjectType", "default": "project"}`), the generated Zod schema now correctly includes the `.default()` modifier.
