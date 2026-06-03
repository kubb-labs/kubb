---
'@kubb/adapter-oas': patch
---

Isolate the OpenAPI-specific schema decisions (nullability, `$ref` detection and resolution, discriminator, binary) behind a single `SchemaDialect` passed into `createSchemaParser`. The converter pipeline and dispatch rules are now dialect-driven with the OAS dialect as the default, so the spec-specific surface lives in one documented place, the seam a future adapter (e.g. AsyncAPI) targets. No change to generated output.
