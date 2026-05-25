---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
---

Add a generic `dispatch` helper and `DispatchRule` type to `@kubb/ast`: an ordered match/convert table that maps source-spec shapes onto Kubb AST nodes. `@kubb/adapter-oas` now builds its OAS schema parser on top of it, replacing the long `parseSchema` if/else chain with a declarative `schemaRules` table. The mechanism is spec-agnostic, so future adapters (e.g. AsyncAPI) can reuse the same traversal by defining their own context type and rules. No change to generated output.
