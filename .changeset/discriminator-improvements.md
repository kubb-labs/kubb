---
"@kubb/oas": patch
"@kubb/plugin-oas": patch
---

Improved discriminator handling for OpenAPI schemas:

- Support for inline schemas in oneOf/anyOf (not just $ref)
- Support for extension properties as discriminator names (e.g., x-linode-ref-name)
- Support for const and single-value enum discriminator values
- Synthetic ref handling for inline schemas with bounds validation
- Extension property discriminators treated as metadata (no runtime constraints)
- Full OpenAPI 3.0 and 3.1 compliance validated with comprehensive tests
