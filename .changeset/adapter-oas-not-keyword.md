---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Keep the `not` keyword on schema nodes. `SchemaNode` gets an optional `not` field, and the OAS adapter fills it with the parsed `not` schema. Required keys inside `not` that have no property schema are kept, so negating them doesn't reject every value. Visitors don't walk `not`, so printers that can't express negation (for example TypeScript types) don't import refs used only there.
