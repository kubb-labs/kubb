---
layout: doc
title: Name collisions - How Kubb resolves clashing names
description: See how Kubb resolves generated names that clash, in path parameters, operation files, barrels, and resolvers, and how to rename a schema everywhere.
outline:
  - 2
  - 3
order: 5
navigation:
  title: Name collisions
  icon: i-iconoir-copy
---

# Name collisions

How Kubb resolves two generated names that clash, and how to rename a schema so every plugin follows. Read it when a name gets a `2` suffix or a build reports a duplicate export.

## How each part resolves a clash {#name-collisions}

| Part | Clash | What Kubb does | Fix |
| --- | --- | --- | --- |
| `@kubb/adapter-oas` [`pathParamsCasing`](/extensions/kubb-labs/adapter-oas/options#pathparamscasing) | Two path parameters get the same name | Adds a counter suffix: `{group-id}` and `{group.id}` become `groupId` and `groupId2` | None needed |
| `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker` with [`operations: 'export'`](/extensions/kubb-labs/plugin-ts/options#operations) | An operation file and a schema file have the same name, ignoring case | Adds an `Operation` suffix: operation `point` goes to `PointOperation.ts` next to schema `Point.ts` | None needed |
| `@kubb/plugin-barrel` [`output.barrel`](/extensions/kubb-labs/plugin-barrel/options#outputbarrel) | Two files export the same name | Reports [`KUBB_BARREL_DUPLICATE_EXPORT`](/docs/5.x/reference/diagnostics#kubb-barrel-duplicate-export). A `named` barrel keeps only the first export. | Rename one declaration, or change the plugin `resolver` to produce distinct names |
| `@kubb/plugin-barrel` [`namespace`](/extensions/kubb-labs/plugin-barrel/options#namespace) | Conflicting exports | Reports a diagnostic | Change `group.name` |
| [`resolver.resolveName`](/docs/5.x/reference/kit/resolvers#name-reservations) | The preferred name is taken | Adds `2`, `3`, and so on | Reserve names first, as in [Reserve names in a resolver](#reserve-names) |

### Path parameters {#path-parameters}

With `pathParamsCasing`, names that collide get a counter suffix. Path parameter names never reach the wire, so the HTTP request stays the same.

The exception is the `matrix` style, which sends the name (`;group-id=42`). An operation with a matrix path parameter keeps its spec names.

### Reserve names in a resolver {#reserve-names}

`resolver.resolveName({ key, name })` keeps the preferred name when it is free and adds `2`, `3`, and so on when it is taken. Use the same key for a declaration and its references.

- A key is a string or an array of string or `undefined` segments, compared in order. A string key never equals an array key.
- The driver reserves component names after each plugin's macros and filters run, while `resolver.name` only applies casing. Reserve other identifiers, such as enum type aliases, with `resolver.reserveNames` first.
- Pass `normalize` when the emitted identifier differs from the raw name, which `resolveName` returns.
- Return several names from `normalize` when one declaration emits several identifiers, such as an enum's value and its type alias. The name is taken only when all are free. Keep numeric suffixes distinct.

```typescript [reserve-enums.ts]
const name = resolver.resolveName({
  key: ['enum', owner, node.pointer],
  name: node.name,
  normalize: (candidate) => [resolver.name(candidate), `${candidate}Key`],
})
```

Allocate names only for declarations the generator emits. `Resolver.merge` returns a resolver with no reservations.

### Rename a schema in an adapter or a macro {#rename-schemas}

- An adapter that renames a schema, such as to break a name collision, sets `targetName` on every ref node that points at it. [`resolver.imports`](/docs/5.x/reference/kit/resolvers#imports) and `ast.ref.getName` then use the new name. See [Adapters](/docs/5.x/reference/kit/adapters).
- A plugin that imports another plugin's output computes names from the nodes it sees. Register a rename [macro](/docs/5.x/reference/kit/ast#macros) on every plugin that touches the schema, such as through one shared `macros` array. [Rename a schema](/docs/5.x/how-to/customize#rename-a-schema) has a working macro that renames the declaration and every ref to it.
