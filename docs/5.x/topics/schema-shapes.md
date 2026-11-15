---
layout: doc
title: Schema shapes - Unions, enums, cycles, and patterns
description: See how Kubb plugins handle oneOf and anyOf unions, enum names, circular schemas, and regex patterns, and which option changes each.
outline:
  - 2
  - 3
order: 4
navigation:
  title: Schema shapes
  icon: i-iconoir-union
---

# Schema shapes

How Kubb plugins handle unions, enums, circular schemas, and regex patterns. Read it when one of these shapes validates, names, or mocks differently than you expect.

## Unions and oneOf {#unions-and-one-of}

When a `oneOf` rejects valid data, check which call `@kubb/plugin-zod` writes. [`oneOfType`](/extensions/kubb-labs/plugin-zod/options#oneoftype) picks it for a `oneOf` without a discriminator.

| Schema | `oneOfType: 'union'` (default) | `oneOfType: 'xor'` |
| --- | --- | --- |
| `oneOf` without a discriminator | `z.union([...])`. Inline object members without `additionalProperties` print as `z.strictObject(...)`. | `z.xor([...])`. Members keep their own `additionalProperties`. Needs Zod 4.2 or later. |
| `oneOf` with a discriminator, every member an object | `z.discriminatedUnion(...)` | `z.discriminatedUnion(...)` |
| `anyOf` | `z.union(...)` | `z.union(...)` |

- With `'union'`, a value with another member's keys fails that member. Extra keys that the spec allows fail too.
- `z.xor` passes only when exactly one member matches, as `oneOf` requires.
- `z.discriminatedUnion` members keep the extra keys the spec allows.

> [!WARNING]
> With `'xor'`, members need `required` keys that tell them apart. When every key is optional, an object matches several members and `z.xor` rejects it.

## Enums {#enums}

When you need the name of a generated enum, start from the adapter. It names an inline enum from the schema name, the property name, and [`enumSuffix`](/extensions/kubb-labs/adapter-oas/options#enumsuffix), in PascalCase. Plugins derive their own names from it.

For the `status` enum on `Pet`:

| Name | Set by |
| --- | --- |
| `PetStatusEnum` | `@kubb/adapter-oas`, with the default `enumSuffix: 'enum'` |
| `petStatusEnum` | `@kubb/plugin-ts`, the constant |
| `PetStatusEnumKey` | `@kubb/plugin-ts`, the type of its values |

## Circular schemas {#circular-schemas}

When schemas reference each other in a cycle, `@kubb/plugin-faker` factories in that cycle use the declared model as their base return type. They do this with [`typeMode: 'inferred'`](/extensions/kubb-labs/plugin-faker/options#typemode) too, so TypeScript does not infer in a circle. Overrides still keep their types.

## Regex patterns {#regex-patterns}

When a Faker mock does not match a `pattern`, check [`regexGenerator`](/extensions/kubb-labs/plugin-faker/options#regexgenerator).

- With `'faker'`, Kubb rewrites `\d`, `\w`, escaped characters such as `\+`, and open-ended counts such as `{1,}` into a form Faker reads.
- Faker does not support groups, alternation (`a|b`), or `\s`.
- For those, set `regexGenerator: 'randexp'`, which supports a wider regex grammar. Install `randexp` in the app.
