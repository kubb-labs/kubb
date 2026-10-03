---
'@kubb/adapter-oas': minor
---

Automatically recognize OpenAPI 3.1 `oneOf`/`anyOf` const unions as named enums when their members have distinct, non-empty titles and distinct string or number values. Member titles and descriptions are retained alongside their original wire values, without an additional adapter option. Recognition runs after Kubb's existing upgrade to OpenAPI 3.1. Ordinary enum unions and incomplete, ambiguous or additionally constrained unions retain their existing representation. Recognition can change generated enum exports, such as a literal-union `Status` type becoming an enum-backed `StatusKey` with `@kubb/plugin-ts` and `enum.type: 'asConst'`.
