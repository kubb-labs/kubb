---
layout: doc
title: Additional properties - Dictionaries and open objects
description: See how Kubb types and validates additionalProperties, patternProperties, and propertyNames, from the adapter's unknownType to Zod records.
outline:
  - 2
  - 3
order: 3
navigation:
  title: Additional properties
  icon: i-iconoir-key
---

# Additional properties

How Kubb types and validates the extra keys of an object: `additionalProperties`, `patternProperties`, and `propertyNames`. Read it when a dictionary or an open object generates a type you did not expect.

## How each plugin handles extra keys {#additional-properties}

| Plugin | What it does with extra keys |
| --- | --- |
| `@kubb/adapter-oas` | Types a value the spec leaves open, such as `additionalProperties: {}`, with [`unknownType`](/extensions/kubb-labs/adapter-oas/options#unknowntype) |
| `@kubb/plugin-ts` | Always types the values of `additionalProperties: true` as `unknown`, whatever `unknownType` is |
| `@kubb/plugin-zod` | Prints a dictionary with `z.record` or `z.partialRecord`, or `.catchall(valueSchema)` next to fixed properties |

### Values the spec leaves open {#unknown-values}

`unknownType` applies to:

- the values of `additionalProperties: {}`
- a `patternProperties` entry set to `true` or `{}`
- the extra items of an open `prefixItems` tuple
- a parameter without a `schema`

`additionalProperties: true` is not affected. `@kubb/plugin-ts` always types its values as `unknown`.

### Dictionaries in Zod {#zod-dictionaries}

`@kubb/plugin-zod` picks the call from the key schema. See [Format and type mappings](/extensions/kubb-labs/plugin-zod/options#format-and-type-mappings) for the other formats.

| Schema | Zod and Zod Mini | Notes |
| --- | --- | --- |
| `object`, `propertyNames: <schema>` | `z.record(keySchema, schema)` | Validated keys, such as a pattern or format |
| `object`, `propertyNames: <enum>` | `z.partialRecord(enumSchema, schema)` | Enum keys may be missing |
| `patternProperties` | `z.record(z.string().regex(...), valueSchema)` | Zod Mini uses `z.string().check(z.regex(...))` for the key |
| `additionalProperties: <schema>`, no fixed properties | A dictionary | |
| `additionalProperties: <schema>`, with fixed properties | `.catchall(valueSchema)` | Keeps the declared shape |

- An open key schema from `propertyNames`, such as a regex, UUID, or length constraint, prints `z.record(keySchema, valueSchema)`.
- Closed keys, such as enums, literals, or unions of enums, print `z.partialRecord`, so only present keys are validated. The inferred type is `Partial<Record<Keys, Value>>`.
- `patternProperties` joins its key patterns into one alternation.

### Object nodes in the AST {#object-nodes}

For plugin authors: an `object` node holds `properties`, and can hold `propertyNames`, a schema for each key. A `not` node has no TypeScript equivalent. See [Schema node types](/docs/5.x/reference/kit/ast#schema-node-types).
