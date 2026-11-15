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

Validates the spec with `@readme/openapi-parser` before parsing. Each problem is reported as a [`KUBB_INVALID_SPEC`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-spec) warning, and generation continues. Set it to `false` to skip the check, which speeds up a large spec. Run [`kubb validate`](https://kubb.dev/docs/5.x/reference/commands/validate) to list every error.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

> [!NOTE]
> `@readme/openapi-parser` does not support OpenAPI 3.2 yet, so a 3.2 document is not validated. Kubb reports one warning that says so.

#### contentType

Media type to keep when an operation declares several, for both request bodies and responses. Without a value, Kubb keeps every media type the operation declares.

|          |                                |
| -------- | ------------------------------ |
| Type     | `'application/json' \| string` |
| Required | `false`                        |

#### server

Selects the entry in the spec's `servers` array that Kubb resolves into the document `baseURL`, and fills in its `{variable}` placeholders.

|          |                                                          |
| -------- | -------------------------------------------------------- |
| Type     | `{ index?: number, variables?: Record<string, string> }` |
| Required | `false`                                                  |

| Field       | What it does                                                                            |
| ----------- | --------------------------------------------------------------------------------------- |
| `index`     | Position in the spec's `servers` array, usually `0`. Without it, `baseURL` is `null`.   |
| `variables` | Values for the placeholders. A variable you leave out uses its `default` from the spec. |

With a spec server of `https://api.{env}.example.com`, `server: { index: 0, variables: { env: 'prod' } }` resolves `baseURL` to `https://api.prod.example.com`.

The resolved `baseURL` reaches banner functions through `BannerMeta.baseURL`, but it does not set request URLs. To change where a generated client sends requests, set the client plugin's own `baseURL`, as in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch), [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios), or [`@kubb/plugin-msw`](https://kubb.dev/extensions/kubb-labs/plugin-msw).

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

#### enums

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
Lifts every inline enum to a top-level schema named after its context, such as `PetStatusEnum`, and references it wherever it appears.
:::

::

The names are the same in both modes. With `'root'`, the enum is a schema of its own, so a plugin that writes one file per schema gives it its own file. For an enum with the values `active` and `inactive` on `Pet.status`, `@kubb/plugin-ts` writes:

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

Suffix in the names Kubb gives inline enums: schema name, property name, and suffix, in PascalCase. The `status` enum on `Pet` becomes `PetStatusEnum`, or `PetStatusType` with `enumSuffix: 'type'`. Plugins derive their own names from it, such as `petStatusEnum` and `PetStatusEnumKey` in `@kubb/plugin-ts`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'enum'` |

#### pathParamsCasing

Renames `path` parameters and their `{placeholder}` in the operation path. Omit it to keep the names from the spec.

|          |               |
| -------- | ------------- |
| Type     | `'camelcase'` |
| Required | `false`       |
| Default  | `undefined`   |

With `'camelcase'`, `{pet-id}`, `{pet_id}`, and `{PetId}` all become `petId`. MSW routes and query keys use the same name. For `GET /stores/{store-id}/pets/{pet-id}`, `@kubb/plugin-client` generates:

::code-group

```typescript [default]
await getPet({ path: { 'store-id': storeId, 'pet-id': petId } })
```

```typescript ['camelcase']
await getPet({ path: { storeId, petId } })
```

::

- Names that collide get a counter suffix, so `{group-id}` and `{group.id}` become `groupId` and `groupId2`.
- Path parameter names never reach the wire, so the HTTP request stays the same. The exception is the `matrix` style, which sends the name (`;group-id=42`), so an operation with a matrix path parameter keeps its spec names.
- Query, header, cookie, and body names do not change.

### Type mapping

#### dateType

How `date-time`, `date`, and `time` schemas are typed.

|          |                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------- |
| Type     | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date' \| { dateTime?, date?, time? }` |
| Required | `false`                                                                                         |
| Default  | `'string'`                                                                                      |

A single value applies to all three formats:

::field-group

:::field{name="'string'"}
Types `date-time`, `date`, and `time` as ISO 8601 strings.
:::

:::field{name="false"}
Types all three as plain strings, with no format check.
:::

:::field{name="'stringOffset'"}
Types `date-time` as a string with a timezone offset. `date` and `time` are typed as with `'string'`.
:::

:::field{name="'stringLocal'"}
Types `date-time` as a local string without a timezone. `date` and `time` are typed as with `'string'`.
:::

:::field{name="'date'"}
Types all three as a JavaScript `Date`.
:::

::

The string variants all type the value as `string`. Schema plugins such as `@kubb/plugin-zod` check the offset or local format. A `Date` needs parsing to revive it from JSON.

Pass an object to set each format on its own. `dateTime` takes every value above, and `date` and `time` take `false`, `'string'`, or `'date'`. A key you leave out is `'string'`, whatever the other keys are.

```typescript
adapterOas({
  dateType: {
    dateTime: 'date', // Date object for timestamps
    date: 'string',
    time: 'string',
  },
})
```

#### integerType

How a schema with `format: int64` or `format: uint64` is typed. Other integers, such as `type: integer` without a format or with `format: int32`, are always `number`.

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

A schema with `type: string` stays a `string` whatever its `format`, so the [ProtoJSON](https://protobuf.dev/programming-guides/json/#int64-strings) `int64` strings that gRPC-gateway sends stay strings. `@kubb/plugin-zod` checks them with a digits regex, and `@kubb/plugin-faker` mocks them as numeric strings.

#### unknownType

Type used where the spec allows any value but gives no schema for it.

|          |                                |
| -------- | ------------------------------ |
| Type     | `'any' \| 'unknown' \| 'void'` |
| Required | `false`                        |
| Default  | `'unknown'`                    |

It applies to:

- the values of `additionalProperties: {}`
- a `patternProperties` entry set to `true` or `{}`
- the extra items of an open `prefixItems` tuple
- a parameter without a `schema`

`additionalProperties: true` is not affected. `@kubb/plugin-ts` always types its values as `unknown`.

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

Type used for a schema with nothing to infer a type from: an empty schema (`{}`), a schema without a `type` such as one with only a `description`, and a response without a schema. It takes the same values as [`unknownType`](#unknowntype) and follows it when unset.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'any' \| 'unknown' \| 'void'`           |
| Required | `false`                                  |
| Default  | `unknownType`, so `'unknown'` by default |

> [!TIP]
> Set `unknownType: 'unknown'` for safety and `emptySchemaType: 'any'` so empty 204 response bodies stay easy to use.
