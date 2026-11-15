# Options

Pass these options to `adapterOas()`. All of them are optional.

## Options overview

| Option                                  | Purpose                                                   | Default               |
| --------------------------------------- | --------------------------------------------------------- | --------------------- |
| **Reading the spec**                    |                                                           |                       |
| [`validate`](#validate)                 | Validate the spec before parsing.                         | `true`                |
| [`contentType`](#contenttype)           | Media type to keep for request and response schemas.      | Every media type      |
| [`server`](#server)                     | Spec server that becomes the document `baseURL`.          | None                  |
| **Schema shape**                        |                                                           |                       |
| [`discriminator`](#discriminator)       | How `discriminator` fields are applied.                   | `'preserve'`          |
| [`enums`](#enums)                       | Where inline enums live.                                  | `'inline'`            |
| [`enumSuffix`](#enumsuffix)             | Suffix for derived enum names.                            | `'enum'`              |
| [`pathParamsCasing`](#pathparamscasing) | Rename path parameters to camelCase.                      | None                  |
| **Type mapping**                        |                                                           |                       |
| [`dateType`](#datetype)                 | How `date-time`, `date`, and `time` schemas are typed.    | `'string'`            |
| [`integerType`](#integertype)           | How `int64` and `uint64` integers are typed.              | `'bigint'`            |
| [`unknownType`](#unknowntype)           | Type for open map values and parameters without a schema. | `'unknown'`           |
| [`emptySchemaType`](#emptyschematype)   | Type for schemas with no type to infer.                   | Same as `unknownType` |

## Option details

### Reading the spec

#### validate

Validates the spec with `@readme/openapi-parser` and reports each problem as a [`KUBB_INVALID_SPEC`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-spec) warning. Generation continues. Set it to `false` to speed up a large spec, and run [`kubb validate`](https://kubb.dev/docs/5.x/reference/commands/validate) to list every error.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

> [!NOTE]
> An OpenAPI 3.2 document is not validated yet, because `@readme/openapi-parser` does not support 3.2. Kubb reports one warning that says so.

#### contentType

Media type to keep when an operation declares several, for both request bodies and responses.

|          |                                |
| -------- | ------------------------------ |
| Type     | `'application/json' \| string` |
| Required | `false`                        |
| Default  | Every media type               |

#### server

Selects the entry in the spec's `servers` array that becomes the document `baseURL`, and fills in its `{variable}` placeholders.

|          |                                                          |
| -------- | -------------------------------------------------------- |
| Type     | `{ index?: number, variables?: Record<string, string> }` |
| Required | `false`                                                  |
| Default  | None, so `baseURL` is `null`                             |

- `index`: position in the `servers` array, usually `0`.
- `variables`: values for the placeholders. A variable you leave out uses its `default` from the spec.

With a spec server of `https://api.{env}.example.com`, `server: { index: 0, variables: { env: 'prod' } }` resolves `baseURL` to `https://api.prod.example.com`.

> [!WARNING]
> `baseURL` reaches banner functions through `BannerMeta.baseURL`, but it does not set request URLs. To change where a client sends requests, set the client plugin's own `baseURL`, as in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch), [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios), or [`@kubb/plugin-msw`](https://kubb.dev/extensions/kubb-labs/plugin-msw).

### Schema shape

#### discriminator

How `discriminator` fields on `oneOf` and `anyOf` schemas are applied.

|          |                             |
| -------- | --------------------------- |
| Type     | `'preserve' \| 'propagate'` |
| Required | `false`                     |
| Default  | `'preserve'`                |

::field-group

:::field{name="'preserve'"}
Keeps child schemas as written. The parent union still narrows each branch by its discriminator value.
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

#### enums

Where inline enums live. The names are the same in both modes.

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
Lifts every inline enum to a top-level schema named after its context, such as `PetStatusEnum`, and references it wherever it appears. A plugin that writes one file per schema gives it its own file.
:::

::

For an enum with the values `active` and `inactive` on `Pet.status`, `@kubb/plugin-ts` writes:

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

#### enumSuffix

Suffix in the names Kubb gives inline enums: schema name, property name, and suffix, in PascalCase. The `status` enum on `Pet` becomes `PetStatusEnum`, or `PetStatusType` with `enumSuffix: 'type'`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'enum'` |

See [Enums](EDGE:enums).

#### pathParamsCasing

Renames `path` parameters and their `{placeholder}` in the operation path. With `'camelcase'`, `{pet-id}`, `{pet_id}`, and `{PetId}` all become `petId`, in clients, MSW routes, and query keys. The HTTP request stays the same.

|          |               |
| -------- | ------------- |
| Type     | `'camelcase'` |
| Required | `false`       |
| Default  | `undefined`   |

For `GET /stores/{store-id}/pets/{pet-id}`, `@kubb/plugin-client` generates:

::code-group

```typescript [default]
await getPet({ path: { 'store-id': storeId, 'pet-id': petId } })
```

```typescript ['camelcase']
await getPet({ path: { storeId, petId } })
```

::

Query, header, cookie, and body names do not change.

See [Name collisions](EDGE:name-collisions).

See [Parameter serialization](EDGE:parameter-serialization).

### Type mapping

#### dateType

How `date-time`, `date`, and `time` schemas are typed. A single value applies to all three formats.

|          |                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------- |
| Type     | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date' \| { dateTime?, date?, time? }` |
| Required | `false`                                                                                         |
| Default  | `'string'`                                                                                      |

::field-group

:::field{name="'string'"}
Types all three as ISO 8601 strings.
:::

:::field{name="false"}
Types all three as plain strings, with no format check.
:::

:::field{name="'stringOffset'"}
Types `date-time` as a string with a timezone offset, and `date` and `time` as with `'string'`.
:::

:::field{name="'stringLocal'"}
Types `date-time` as a local string without a timezone, and `date` and `time` as with `'string'`.
:::

:::field{name="'date'"}
Types all three as a JavaScript `Date`. A `Date` needs parsing to revive it from JSON.
:::

::

Pass an object to set each format on its own. A key you leave out is `'string'`.

```typescript
adapterOas({
  dateType: {
    dateTime: 'date', // Date object for timestamps
    date: 'string',
    time: 'string',
  },
})
```

See [Dates and times](EDGE:dates-and-times).

#### integerType

How a schema with `format: int64` or `format: uint64` is typed. Other integers, such as `format: int32` or no format, are always `number`.

|          |                        |
| -------- | ---------------------- |
| Type     | `'number' \| 'bigint'` |
| Required | `false`                |
| Default  | `'bigint'`             |

::field-group

:::field{name="'bigint'"}
Keeps 64-bit IDs exact. `JSON.stringify` and `JSON.parse` cannot round-trip a bigint, so use it only when the app handles bigint serialization.
:::

:::field{name="'number'"}
Fits most JSON APIs. Loses precision above `Number.MAX_SAFE_INTEGER`.
:::

::

A schema with `type: string` stays a `string` whatever its `format`.

See [64-bit integers](EDGE:64-bit-integers).

#### unknownType

Type used where the spec allows any value but gives no schema for it, such as the values of `additionalProperties: {}` or a parameter without a `schema`.

|          |                                |
| -------- | ------------------------------ |
| Type     | `'any' \| 'unknown' \| 'void'` |
| Required | `false`                        |
| Default  | `'unknown'`                    |

::field-group

:::field{name="'unknown'"}
Callers must narrow the value before they use it.
:::

:::field{name="'any'"}
Callers can use the value without type checks.
:::

:::field{name="'void'"}
Marks a value callers should not use, to match a legacy API.
:::

::

See [Additional properties](EDGE:additional-properties).

#### emptySchemaType

Type used for a schema with nothing to infer a type from, such as `{}`, a schema without a `type`, or a response without a schema. It takes the same values as [`unknownType`](#unknowntype).

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'any' \| 'unknown' \| 'void'`           |
| Required | `false`                                  |
| Default  | `unknownType`, so `'unknown'` by default |

> [!TIP]
> Set `unknownType: 'unknown'` for safety and `emptySchemaType: 'any'` so empty 204 response bodies stay easy to use.
