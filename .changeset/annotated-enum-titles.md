---
'@kubb/adapter-oas': minor
---

Add the opt-in `annotatedEnums` option to recognize OpenAPI 3.1 `oneOf`/`anyOf` const unions as named enums. Member titles and descriptions are retained alongside their original string or number values. The option defaults to false; incomplete, ambiguous or additionally constrained unions retain their existing representation.
