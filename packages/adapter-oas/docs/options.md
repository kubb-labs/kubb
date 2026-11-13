# Options

Pass these options to `adapterOas()`. All of them are optional.

## Options overview

| Option                                  | Purpose                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| [`validate`](#validate)                 | Validate the spec before parsing.                            |
| [`contentType`](#contenttype)           | Preferred media type for request and response schemas.       |
| [`server`](#server)                     | Which spec server Kubb resolves into the document `baseURL`. |
| [`discriminator`](#discriminator)       | How `discriminator` fields are interpreted.                  |
| [`enums`](#enums)                       | Where inline enums live.                                     |
| [`pathParamsCasing`](#pathparamscasing) | Rename path parameters to camelCase.                         |
| [`dateType`](#datetype)                 | How `date-time`, `date`, and `time` schemas are represented. |
| [`integerType`](#integertype)           | How `int64` and `uint64` integers map to TypeScript.         |
| [`unknownType`](#unknowntype)           | Type for open map values and parameters without a schema.    |
| [`emptySchemaType`](#emptyschematype)   | Type for schemas with no type to infer.                      |
| [`enumSuffix`](#enumsuffix)             | Suffix for derived enum names.                               |

## Option details

### validate

Validates the OpenAPI spec with `@readme/openapi-parser` before parsing. Each problem is reported as a [`KUBB_INVALID_SPEC`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-spec) warning, and generation continues. Set it to `false` to skip the check, which makes generation faster on a large spec. Run [`kubb validate`](https://kubb.dev/docs/5.x/reference/commands/validate) to list every error. An OpenAPI 3.2 document is not validated yet, because `@readme/openapi-parser` does not support 3.2. Kubb reports one warning that says so.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

### contentType

Media type to keep when an operation declares several, for both request bodies and responses. Without a value, Kubb keeps every media type the operation declares.

|          |                                |
| -------- | ------------------------------ |
| Type     | `'application/json' \| string` |
| Required | `false`                        |

### server

Selects which entry in the spec's `servers` array Kubb resolves into the document `baseURL`, filling in any `{variable}` placeholders. `server.index` points at one of the spec's servers, usually `0` for the primary one. `server.variables` supplies placeholder values, falling back to each variable's `default` from the spec. When `server` or `server.index` is omitted, `baseURL` resolves to `null`.

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
Keeps child schemas exactly as written. The parent union still narrows each branch by its discriminator value.
:::

:::field{name="'propagate'"}
Also writes the discriminator property with its literal value into each child schema, so `Cat` and `Dog` are narrowed when used on their own.
:::

::

::code-group

```yaml [OpenAPI spec]
openapi: 3.0.3
components:
  schemas:
    Animal:
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
export type Cat = {
  type?: string;
  indoor?: boolean;
};

export type Dog = {
  type?: string;
  name?: string;
};

export type Animal = Cat & {
  type: 'cat';
} | Dog & {
  type: 'dog';
};
```

```typescript ['propagate']
export type Cat = {
  type: 'cat';
  indoor?: boolean;
};

export type Dog = {
  type: 'dog';
  name?: string;
};

export type Animal = Cat & {
  type: 'cat';
} | Dog & {
  type: 'dog';
};
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
Keeps each enum on the property that declares it.
:::

:::field{name="'root'"}
Lifts every inline enum to a top-level schema named after its context (for example `PetStatusEnum`) and references it wherever it appears.
:::

::

The names are the same in both modes. With `'root'`, the enum is a schema of its own, so a plugin that writes one file per schema gives it its own file. For an enum with values `active` and `inactive` on `Pet.status`, `@kubb/plugin-ts` writes:

::code-group

```typescript ['inline' (default)]
// types/Pet.ts
export const petStatusEnum = {
  active: 'active',
  inactive: 'inactive',
} as const;

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum];

export type Pet = {
  status?: PetStatusEnumKey;
};
```

```typescript ['root']
// types/PetStatusEnum.ts
export const petStatusEnum = {
  active: 'active',
  inactive: 'inactive',
} as const;

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum];

// types/Pet.ts
import type { PetStatusEnumKey } from './PetStatusEnum'

export type Pet = {
  status?: PetStatusEnumKey;
};
```

::

### pathParamsCasing

Renames `path` parameters and their `{placeholder}` in the operation path. Omit it to keep the names from the spec.

|          |               |
| -------- | ------------- |
| Type     | `'camelcase'` |
| Required | `false`       |
| Default  | `undefined`   |

With `'camelcase'`, `{pet-id}` becomes `petId`, the same name MSW routes and query keys already use. Names that collide get a counter suffix, so `{group-id}` and `{group.id}` become `groupId` and `groupId2`. Path parameter names never reach the wire, so the HTTP request stays the same. The one exception is the `matrix` style, which sends the name (`;group-id=42`), so an operation with a matrix path parameter keeps its spec names. Query, header, cookie, and body names are not changed.

For `GET /stores/{store-id}/pets/{pet-id}`, `@kubb/plugin-client` generates:

::code-group

```typescript [default]
await getPet({ path: { 'store-id': storeId, 'pet-id': petId } })
```

```typescript ['camelcase']
await getPet({ path: { storeId, petId } })
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
Represents `date-time`, `date`, and `time` as ISO 8601 strings. The generated TypeScript type is `string`.
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

The string variants all emit `string` at the TypeScript type level. Schema plugins such as `@kubb/plugin-zod` validate the offset or local format.

Pass an object to set `dateTime`, `date`, and `time` independently. A key that is left out defaults to `'string'`, regardless of the other keys.

```ts
adapterOas({
  dateType: {
    dateTime: 'date', // Date object for timestamps
    date: 'string',
    time: 'string',
  },
})
```

### integerType

How a schema with `format: int64` or `format: uint64` maps to TypeScript. Other integers, such as `type: integer` without a format or with `format: int32`, always map to `number`.

|          |                        |
| -------- | ---------------------- |
| Type     | `'number' \| 'bigint'` |
| Required | `false`                |
| Default  | `'bigint'`             |

::field-group

:::field{name="'bigint'"}
Represents 64-bit IDs exactly, but `JSON.stringify` and `JSON.parse` cannot round-trip it. Use it only when the application handles bigint serialization itself.
:::

:::field{name="'number'"}
Fits most JSON APIs. It loses precision above `Number.MAX_SAFE_INTEGER`.
:::

::

A schema with `type: string` stays a `string` whatever its `format`, so the [ProtoJSON](https://protobuf.dev/programming-guides/json/#int64-strings) `int64` strings that gRPC-gateway emits stay strings. `@kubb/plugin-zod` validates them with a digits regex, and `@kubb/plugin-faker` mocks them as numeric strings.

### unknownType

AST type used where the spec allows any value but gives no schema for it: the values of `additionalProperties: {}`, a `patternProperties` entry set to `true` or `{}`, the extra items of an open `prefixItems` tuple, and a parameter without a `schema`. `additionalProperties: true` is not affected, and `@kubb/plugin-ts` always types its values as `unknown`.

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

AST type used for a schema with nothing to infer a type from: an empty schema (`{}`), a schema without a `type` such as one that holds only a `description`, and a response without a schema. `emptySchemaType` takes the same values as [`unknownType`](#unknowntype) and follows it when unset.

|          |                                        |
| -------- | -------------------------------------- |
| Type     | `'any' \| 'unknown' \| 'void'`         |
| Required | `false`                                |
| Default  | `unknownType` (`'unknown'` by default) |

> [!TIP]
> A common pairing sets `unknownType: 'unknown'` for safety and `emptySchemaType: 'any'` so empty 204 response bodies stay easy to use.

### enumSuffix

Suffix for the names Kubb gives inline enums: schema name, property name, and suffix, in PascalCase. The `status` enum on `Pet` becomes `PetStatusEnum`, or `PetStatusType` with `enumSuffix: 'type'`. Plugins derive their own names from it, such as `petStatusEnum` and `PetStatusEnumKey` in `@kubb/plugin-ts`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'enum'` |
