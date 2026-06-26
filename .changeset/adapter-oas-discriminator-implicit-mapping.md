---
'@kubb/adapter-oas': patch
---

Narrow `oneOf`/`anyOf` discriminated unions that omit a `mapping`.

When a union declares a `discriminator` without a `mapping`, OpenAPI's implicit mapping uses each variant's schema name as the discriminant value. The parser now folds that literal into every `$ref` branch (`Cat & { petType: "Cat" }`), so the generated TypeScript types, Zod schemas, and Faker mocks can narrow on the discriminator field the same way they already do for an explicit `mapping`.

A variant that already pins the discriminator to its own `enum`/`const` is left untouched, since intersecting two different literals would collapse the property to `never`. Unresolvable refs and plain (non-discriminated) unions are unaffected.
