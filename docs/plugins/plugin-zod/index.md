---
layout: doc

title: \@kubb/plugin-zod
outline: deep
---

# @kubb/plugin-zod

With the Zod plugin you can use [Zod](https://zod.dev/) to validate your schemas.

> [!TIP]
> Support for Zod v4 when using Kubb `v3.8.1`, see [Zod 4 migration guide](https://v4.zod.dev/v4/changelog)

## Installation

::: code-group
```shell [bun]
bun add -d @kubb/plugin-zod
```

```shell [pnpm]
pnpm add -D @kubb/plugin-zod
```

```shell [npm]
npm install --save-dev @kubb/plugin-zod
```

```shell [yarn]
yarn add -D @kubb/plugin-zod
```

:::

## Options

### output

Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `true`   |
|  Default: | `'zod'`  |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                                    |
|  Default: | `'named'`                                  |

<!--@include: ../core/barrelTypes.md-->

#### output.banner

Add a banner text in the beginning of every file.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.footer

Add a footer text at the end of every file.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

### contentType

<!--@include: ../core/contentType.md-->

### group

<!--@include: ../core/group.md-->

#### group.type

Define a type where to group the files on.

|           |         |
| --------: | :------ |
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'` |

### importPath

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'zod'`  |

### typed

Use TypeScript(`@kubb/plugin-ts`) to add type annotation.

> [!IMPORTANT]
> We rely on [`tozod`](https://github.com/colinhacks/tozod) from the creator of Zod to create a schema based on a type.
> Kubb contains its own version to those kind of conversions.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### inferred

Return Zod generated schema as type with z.infer.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.<br/>
See [datetimes](https://zod.dev/?id=datetimes).

|           |                                                                  |
| --------: | :--------------------------------------------------------------- |
|     Type: | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date'` |
| Required: | `false`                                                          |
|  Default: | `'string'`                                                       |

::: code-group

```typescript [false]
z.string();
```

```typescript ['string']
z.string().datetime();
```

```typescript ['stringOffset']
z.string().datetime({ offset: true });
```

```typescript ['stringLocal']
z.string().datetime({ local: true });
```

```typescript ['date']
z.date();
```

:::

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

|           |                                |
| --------: | :----------------------------- |
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                        |
|  Default: | `'any'`                        |

::: code-group

```typescript ['any']
z.any();
```

```typescript ['unknown']
z.unknown();
```

```typescript ['void']
z.void()
```
:::

### emptySchemaType

Which type to use for empty schema values.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                        |
|  Default: | `unknownType`                  |

::: code-group
```typescript ['any']
z.any()
```
```typescript ['unknown']
z.unknown()
```
```typescript ['void']
z.void()
```
:::

### coercion

Use of z.coerce.string() instead of z.string().
[Coercion for primitives](https://zod.dev/?id=coercion-for-primitives)

|           |                                                                       |
| --------: | :-------------------------------------------------------------------- |
|     Type: | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean}` |
| Required: | `false`                                                               |
|  Default: | `false'`                                                              |

::: code-group

```typescript [true]
z.coerce.string();
z.coerce.date();
z.coerce.number();
```

```typescript [false]
z.string();
z.date();
z.number();
```

```typescript [{numbers: true, strings: false, dates: false}]
z.string();
z.date();
z.coerce.number();
```

:::

### operations

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### mapper

|           |                          |
| --------: | :----------------------- |
|     Type: | `Record<string, string>` |
| Required: | `false`                  |

### version

Which version of Zod should be used.

|           |              |
| --------: | :----------- |
|     Type: | `'3' \| '4'` |
| Required: | `false`      |
|  Default: | `'3'`        |

### exclude

<!--@include: ../core/exclude.md-->

### override

<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>

<!--@include: ../core/generators.md-->

|           |                               |
| --------: | :---------------------------- |
|     Type: | `Array<Generator<PluginZod>>` |
| Required: | `false`                       |

### transformers

<!--@include: ../core/transformers.md-->

#### transformers.name

Customize the names based on the type that is provided by the plugin.

|           |                                                |
| --------: | :--------------------------------------------- |
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                        |

```typescript
type ResolveType = "file" | "function" | "type" | "const";
```

#### transformers.schema

Customize the schema based on the type that is provided by the plugin.

|           |                                                                                                                             |
| --------: | :-------------------------------------------------------------------------------------------------------------------------- |
|     Type: | `(props: { schema?: SchemaObject; name?: string; parentName?: string}, defaultSchemas: Schema[],) => Schema[] \| undefined` |
| Required: | `false`                                                                                                                     |

### wrapOutput

Modify the generated zod schema.

> [!TIP]
> This is useful for cases where you need to extend the generated zod output with additional properties from an OpenAPI schema. E.g. in the case of `OpenAPI -> Zod -> OpenAPI`, you could include the examples from the schema for a given property and then ultimately provide a modified schema to a router that supports zod and OpenAPI spec generation.

```typescript [Conditionally append .openapi() to the generated schema]
wrapOutput: ({ output, schema }) => {
  const metadata: ZodOpenAPIMetadata = {};

  if (schema.example) {
    metadata.example = schema.example;
  }

  if (Object.keys(metadata).length > 0) {
    return `${output}.openapi(${JSON.stringify(metadata)})`;
  }
};
```

|           |                                                                          |
| --------: | :----------------------------------------------------------------------- |
|     Type: | `(arg: { output: string; schema: SchemaObject }) => string \| undefined` |
| Required: | `false`                                                                  |

## Example

```typescript twoslash
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

export default defineConfig({
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginZod({
      output: {
        path: "./zod",
      },
      group: { type: "tag", name: ({ group }) => `${group}Schemas` },
      typed: true,
      dateType: "stringOffset",
      unknownType: "unknown",
      importPath: "zod",
      wrapOutput: ({ output, schema }) =>
        `${output}.openapi({ description: 'This is a custom extension' })`,
    }),
  ],
});
```

## Links

- [Zod](https://zod.dev/)
