---
'@kubb/adapter-oas': patch
---

Narrow `oneOf`/`anyOf` discriminated unions that omit a `mapping`.

A `discriminator` without a `mapping` still has a value per branch: OpenAPI takes it from the variant's own schema name. The parser now folds that literal into each `$ref` branch, turning a bare `Cat | Dog` into `(Cat & { petType: "Cat" }) | (Dog & { petType: "Dog" })`. Generated types, Zod schemas, and Faker mocks then narrow on the discriminator field, matching what an explicit `mapping` already produces.

A variant that pins the discriminator to its own `enum` or `const` is left as a plain ref, because intersecting two different literals collapses the property to `never`. Unresolvable refs and plain unions stay untouched.
