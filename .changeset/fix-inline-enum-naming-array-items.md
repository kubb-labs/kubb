---
"@kubb/adapter-oas": patch
---

Qualify inline enums with the parent name across more parse paths. Previously only direct object properties got qualified names — enums nested inside array items, allOf members (single and multi), oneOf/anyOf members, union members, response bodies, and request bodies all fell back to bare `{Prop}Enum` names, causing duplicate-identifier collisions in the generated barrel (e.g. ~700 `statusEnum` re-exports across `data[].status` properties in different operations).

Now `parseSchema` propagates the parent name through:

- array items (`convertArray`)
- `allOf` member schemas (both single-member fast path and multi-member combination)
- `oneOf` / `anyOf` member schemas with a shared discriminator
- union members
- operation responses (`{operationId}{statusCode}`)
- operation request bodies (`{operationId}Request`)

Inline enums emerge with qualified names like `GetUsers200DataLastLoginStatusEnum` instead of the bare `StatusEnum`. Reported in kubb-labs/kubb#3362.
