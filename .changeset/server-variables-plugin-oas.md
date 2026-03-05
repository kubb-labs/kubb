---
"@kubb/plugin-oas": minor
---

Added `serverVariables` option to resolve OpenAPI server URL template variables when using `serverIndex`. Variables like `{env}` in server URLs are now substituted with user-provided values or their spec-defined defaults. Enum validation is enforced at generation time.
