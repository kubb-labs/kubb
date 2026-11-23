# Options

Pass these options to `adapterOas()`. All of them are optional.

## Options overview

| Option                                  | Purpose                              | Default               |
| --------------------------------------- | ------------------------------------ | --------------------- |
| **Reading the spec**                    |                                      |                       |
| [`validate`](#validate)                 | Validate the spec.                   | `true`                |
| [`contentType`](#contenttype)           | Media type to keep.                  | Every media type      |
| [`server`](#server)                     | Server that sets `baseURL`.          | None                  |
| **Schema shape**                        |                                      |                       |
| [`discriminator`](#discriminator)       | How discriminators apply.            | `'preserve'`          |
| [`enums`](#enums)                       | Where inline enums live.             | `'inline'`            |
| [`enumSuffix`](#enumsuffix)             | Suffix of enum names.                | `'enum'`              |
| [`pathParamsCasing`](#pathparamscasing) | Rename path parameters to camelCase. | None                  |
| **Type mapping**                        |                                      |                       |
| [`dateType`](#datetype)                 | Type of date and time fields.        | `'string'`            |
| [`integerType`](#integertype)           | Type of `int64` and `uint64` fields. | `'bigint'`            |
| [`unknownType`](#unknowntype)           | Type of open values.                 | `'unknown'`           |
| [`emptySchemaType`](#emptyschematype)   | Type of empty schemas.               | Same as `unknownType` |

## Option details

### Reading the spec

#### validate

Reports each spec problem as a [`KUBB_INVALID_SPEC`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-spec) warning, and generation continues. Set it to `false` to speed up a large spec. [`kubb validate`](https://kubb.dev/docs/5.x/reference/commands/validate) lists every error.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

> [!NOTE]
> OpenAPI 3.2 documents are not validated yet, and get one warning that says so.

#### contentType

Media type to keep for request bodies and responses, also when an operation declares only one. A request body in another media type is dropped. A response in another media type gets [`emptySchemaType`](#emptyschematype).

|          |                                |
| -------- | ------------------------------ |
| Type     | `'application/json' \| string` |
| Required | `false`                        |
| Default  | Every media type               |

#### server

Picks the `servers` entry that becomes the document `baseURL`, and fills in its `{variable}` placeholders.

|          |                                                          |
| -------- | -------------------------------------------------------- |
| Type     | `{ index?: number, variables?: Record<string, string> }` |
| Required | `false`                                                  |
| Default  | None, so `baseURL` is `null`                             |

- `index`: position in the `servers` array, usually `0`. Plugins read it as `meta.serverIndex` to pick the same position in an operation's or a path's own `servers`. `meta.servers` and those lists leave out entries without a `url`, so the position shifts when such an entry comes before the selected one.
- `variables`: placeholder values. A variable you leave out uses its spec `default`.

```typescript
// spec server: https://api.{env}.example.com
adapterOas({ server: { index: 0, variables: { env: 'prod' } } })
// baseURL: https://api.prod.example.com
```

> [!WARNING]
> Banners read this `baseURL` as `BannerMeta.baseURL`, but it does not set request URLs. For those, set `baseURL` on `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-msw`.

### Schema shape

#### discriminator

How `discriminator` fields on `oneOf` and `anyOf` schemas apply.

|          |                             |
| -------- | --------------------------- |
| Type     | `'preserve' \| 'propagate'` |
| Required | `false`                     |
| Default  | `'preserve'`                |

::field-group

:::field{name="'preserve'"}
Keeps child schemas as written. The parent union still narrows each branch.
:::

:::field{name="'propagate'"}
Also writes the discriminator literal into each child schema, so a child is narrowed on its own too.
:::

::

#### enums

Where inline enums live. Names are the same in both modes.

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
Lifts every inline enum to a referenced top-level schema, such as `PetStatusEnum`. A plugin that writes one file per schema gives it its own file.
:::

::

For a `Pet.status` enum, `@kubb/plugin-ts` writes:

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

Suffix of inline enum names. The `status` enum on `Pet` becomes `PetStatusEnum`, or `PetStatusType` with `enumSuffix: 'type'`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'enum'` |

#### pathParamsCasing

Renames `path` parameters and their `{placeholder}` to camelCase, so `{pet-id}`, `{pet_id}`, and `{PetId}` become `petId` in clients, MSW routes, and query keys. The HTTP request and other parameters stay the same.

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

An operation with a `matrix` path parameter keeps all its path parameter names, because a matrix value sends the name.

### Type mapping

#### dateType

How `date-time`, `date`, and `time` schemas are typed. One value sets all three.

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
Like `'string'`, with a timezone offset on `date-time`.
:::

:::field{name="'stringLocal'"}
Like `'string'`, with no timezone on `date-time`.
:::

:::field{name="'date'"}
Types all three as a JavaScript `Date`, which needs parsing to revive from JSON.
:::

::

To type each format on its own, pass an object. `dateTime` takes every value above, `date` and `time` take `false`, `'string'`, or `'date'`, and a key you leave out is `'string'`.

#### integerType

How `format: int64` and `format: uint64` integers are typed. Other integers are always `number`.

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

#### unknownType

Type of a value the spec leaves open, such as the values of `additionalProperties: {}` or a parameter without a `schema`.

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

#### emptySchemaType

Type of a schema with nothing to infer a type from, such as `{}` or a response without a schema. It takes the [`unknownType`](#unknowntype) values.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'any' \| 'unknown' \| 'void'`           |
| Required | `false`                                  |
| Default  | `unknownType`, so `'unknown'` by default |

> [!TIP]
> Pair `unknownType: 'unknown'` with `emptySchemaType: 'any'` to keep empty 204 bodies easy to use.
