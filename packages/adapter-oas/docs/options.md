# Options

Pass these options to `adapterOas()` to control spec validation, the preferred content type, the server base URL, discriminators, enums, and how OpenAPI types map to TypeScript. All of them are optional.

## Options overview

| Option                                | Purpose                                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| [`validate`](#validate)               | Validate the spec before parsing.                            |
| [`contentType`](#contenttype)         | Preferred media type for request and response schemas.       |
| [`server`](#server)                   | Which spec server Kubb resolves into the document `baseURL`. |
| ↳ [`server.index`](#server)           | Select an entry in the spec's servers array.                 |
| ↳ [`server.variables`](#server)       | Supply values for server URL variables.                      |
| [`discriminator`](#discriminator)     | How `discriminator` fields are interpreted.                  |
| [`enums`](#enums)                     | Where inline enums live.                                     |
| [`dateType`](#datetype)               | How `date-time`, `date`, and `time` schemas are represented. |
| ↳ [`dateType.dateTime`](#datetype)    | Configure the representation of timestamps.                  |
| ↳ [`dateType.date`](#datetype)        | Configure the representation of date-only values.            |
| ↳ [`dateType.time`](#datetype)        | Configure the representation of time-only values.            |
| [`integerType`](#integertype)         | How integers map to TypeScript.                              |
| [`unknownType`](#unknowntype)         | Type for schemas Kubb cannot infer.                          |
| [`emptySchemaType`](#emptyschematype) | Type for empty schemas.                                      |
| [`enumSuffix`](#enumsuffix)           | Suffix for derived enum names.                               |

## Option details

### validate

Validates the OpenAPI spec with `@readme/openapi-parser` before parsing. Each problem is reported as a [`KUBB_INVALID_SPEC`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-spec) warning, and generation continues. Set it to `false` to skip the check, which makes generation faster on a large spec. Run [`kubb validate`](https://kubb.dev/docs/5.x/reference/commands/validate) to list every error.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

### contentType

Preferred media type when an operation defines several. Without a value, Kubb falls back to the first JSON-like media type in the spec (`application/json`, `application/x-json`, `text/json`, `text/x-json`, or any `*+json`), and to the first media type overall when none is JSON-like.

|          |                                |
| -------- | ------------------------------ |
| Type     | `'application/json' \| string` |
| Required | `false`                        |

### server

Selects which entry in the spec's `servers` array Kubb resolves into the document `baseURL`, filling in any `{variable}` placeholders. `server.index` points at one of the spec's servers, usually `0` for the primary one. `server.variables` supplies placeholder values, falling back to each variable's `default` from the spec. Omit `server` and `baseURL` resolves to `null`.

|          |                                                          |
| -------- | -------------------------------------------------------- |
| Type     | `{ index?: number, variables?: Record<string, string> }` |
| Required | `false`                                                  |

The resolved `baseURL` reaches banner functions through `BannerMeta.baseURL` but does not set request URLs on its own. To change where a generated client sends requests, use that plugin's own `baseURL` option ([`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch), [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios), [`@kubb/plugin-msw`](https://kubb.dev/extensions/kubb-labs/plugin-msw)).

With a spec server of `https://api.{env}.example.com`, `server: { index: 0, variables: { env: 'prod' } }` resolves `baseURL` to `https://api.prod.example.com`.

### discriminator

How `discriminator` fields on `oneOf`/`anyOf` schemas are interpreted.

|          |                             |
| -------- | --------------------------- |
| Type     | `'preserve' \| 'propagate'` |
| Required | `false`                     |
| Default  | `'preserve'`                |

::field-group

:::field{name="'preserve'"}
Default value. Keeps child schemas exactly as written, though the discriminator still narrows types at the call site.
:::

:::field{name="'propagate'"}
Pushes the discriminator property with its literal value into each child schema, so each branch's `type` field is precisely typed.
:::

::

::code-group

```yaml [OpenAPI spec]
openapi: 3.0.3
components:
  schemas:
    Animal:
      required: [type]
      type: object
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      discriminator:
        propertyName: type
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
    Cat:
      type: object
      properties:
        type: { type: string }
        indoor: { type: boolean }
    Dog:
      type: object
      properties:
        type: { type: string }
        name: { type: string }
```

```typescript ['preserve' (default)]
export type Cat = { type: string; indoor?: boolean }
export type Dog = { type: string; name?: string }
export type Animal = Cat | Dog
```

```typescript ['propagate']
export type Cat = { type: 'cat'; indoor?: boolean }
export type Dog = { type: 'dog'; name?: string }
export type Animal = Cat | Dog
```

::

### enums

Where inline enums live.

|          |                      |
| -------- | -------------------- |
| Type     | `'inline' \| 'root'` |
| Required | `false`              |
| Default  | `'inline'`           |

::field-group

:::field{name="'inline'"}
Default value. Keeps each enum on the property that declares it.
:::

:::field{name="'root'"}
Lifts every inline enum to a reusable top-level schema named after its context (for example `PetStatusEnum`) and references it wherever it appears.
:::

::

For an enum with values `active` and `inactive` on `Pet.status`:

::code-group

```typescript ['inline' (default)]
export type Pet = { status?: 'active' | 'inactive' }
```

```typescript ['root']
export type PetStatusEnum = 'active' | 'inactive'
export type Pet = { status?: PetStatusEnum }
```

::

### dateType

How `date-time`, `date`, and `time` schemas are represented downstream.

|          |                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------- |
| Type     | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date' \| { dateTime?, date?, time? }` |
| Required | `false`                                                                                         |
| Default  | `'string'`                                                                                      |

Pass a single value to apply it to all three formats:

::field-group

:::field{name="false"}
Represents date and time values as plain strings without format validation.
:::

:::field{name="'string'"}
Default value. Represents `date-time`, `date`, and `time` as ISO 8601 strings. The generated TypeScript type is `string`.
:::

:::field{name="'stringOffset'"}
Represents `date-time` as a string with a timezone offset. The `date` and `time` formats fall back to `'string'`.
:::

:::field{name="'stringLocal'"}
Represents `date-time` as a local string without a timezone. The `date` and `time` formats fall back to `'string'`.
:::

:::field{name="'date'"}
Represents date and time values as JavaScript `Date` objects. JSON values need parsing to revive them as `Date` objects.
:::

::

The string variants all emit `string` at the TypeScript type level. The offset and local distinction surfaces in schema output such as Zod.

Pass an object to set `dateTime`, `date`, and `time` independently. A key you leave out defaults to `'string'`, regardless of the other keys.

```ts
adapterOas({
  dateType: {
    dateTime: 'date', // Date object for timestamps
    date: 'string', // plain string for date-only values, since Date can't represent them safely
    time: 'string',
  },
})
```

### integerType

How `type: integer` (and `format: int64`) maps to TypeScript.

|          |                        |
| -------- | ---------------------- |
| Type     | `'number' \| 'bigint'` |
| Required | `false`                |
| Default  | `'bigint'`             |

::field-group

:::field{name="'bigint'"}
Default value. Represents 64-bit IDs exactly, but `JSON.stringify` and `JSON.parse` cannot round-trip it. Use it only when you handle bigint serialization yourself.
:::

:::field{name="'number'"}
Fits most JSON APIs. It loses precision above `Number.MAX_SAFE_INTEGER`.
:::

::

This option only applies to schemas that declare a numeric type. A schema that declares `type: string` stays a `string` whatever its format, so the `{ type: 'string', format: 'int64' }` that gRPC-gateway and other [ProtoJSON](https://protobuf.dev/programming-guides/json/#int64-strings) producers emit generates a `string`. `@kubb/plugin-zod` validates those fields with a digits `.regex(...)` and `@kubb/plugin-faker` mocks them with a numeric string.

### unknownType

AST type used when a schema's type cannot be inferred from the spec (`additionalProperties: true`, a missing `type`, and similar).

|          |                                |
| -------- | ------------------------------ |
| Type     | `'any' \| 'unknown' \| 'void'` |
| Required | `false`                        |
| Default  | `'unknown'`                    |

::field-group

:::field{name="'unknown'"}
Requires callers to narrow the value before using it.
:::

:::field{name="'any'"}
Allows callers to use the value without type checking.
:::

:::field{name="'void'"}
Represents a value callers should not use. Choose it when matching a legacy API that uses `void`.
:::

::

### emptySchemaType

AST type used for fully empty schemas (`{}`). It follows `unknownType` unless you set it. Override it only when empty schemas should be treated differently from unresolvable ones.

|          |                                        |
| -------- | -------------------------------------- |
| Type     | `'any' \| 'unknown' \| 'void'`         |
| Required | `false`                                |
| Default  | `unknownType` (`'unknown'` by default) |

::field-group

:::field{name="'unknown'"}
Requires callers to narrow the value before using it.
:::

:::field{name="'any'"}
Allows callers to use the value without type checking.
:::

:::field{name="'void'"}
Represents a value callers should not use. Choose it when matching a legacy API that uses `void`.
:::

::

> [!TIP]
> A common pairing sets `unknownType: 'unknown'` for safety and `emptySchemaType: 'any'` so empty 204 response bodies stay easy to use.

### enumSuffix

Suffix appended to derived enum names when Kubb has to invent one, typically for inline enums on object properties. The derived name joins the parent schema name, the property name, and the suffix in PascalCase, so an inline enum on the `status` property of the `Pet` schema derives `PetStatusEnum`. Set it to `'type'` and the same enum derives `PetStatusType`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'enum'` |
