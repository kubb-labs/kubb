---
'@kubb/adapter-oas': patch
---

Bundle external `$ref`s with `api-ref-bundler` instead of `@apidevtools/json-schema-ref-parser`.

`$RefParser.bundle()` remaps external file refs to the JSON pointer of their first occurrence (for example `#/components/schemas/AppState/properties/currentUser`), so multi-file specs lost their named schemas and generators inlined types instead of emitting named types with imports. `api-ref-bundler` hoists external file schemas into named `components.schemas` entries (`./schemas/User.yaml` becomes `#/components/schemas/User`), matching the earlier Redocly behavior while staying lightweight, and adds a foundation for AsyncAPI support later on.

The new bundler resolves local YAML and JSON files and HTTP(S) URLs, including `./` and `../` relative refs and pointer fragments into external files.
