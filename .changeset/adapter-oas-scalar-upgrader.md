---
'@kubb/adapter-oas': patch
---

Convert Swagger 2.0 specs with `@scalar/openapi-upgrader` instead of `swagger2openapi`.

The old converter pulled in the legacy oas-kit and node-fetch dependency tree (around 1.5 MB) for a single `convertObj` call. `@scalar/openapi-upgrader` is a focused ESM package that does the same 2.0 to 3.0 transform, cutting install size to roughly 480 KB. The upgrader runs on every parsed document and only rewrites Swagger 2.0 input (it checks for `swagger: '2.0'` internally), so OpenAPI 3.0 and 3.1 documents pass through untouched. The internal `isOpenApiV2Document` guard is gone as a result.
