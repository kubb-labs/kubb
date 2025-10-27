---
layout: doc

title: \@kubb/plugin-zod
outline: deep
---

# @kubb/plugin-zod

С помощью плагина Zod вы можете использовать [Zod](https://zod.dev/) для валидации ваших схем.

> [!TIP]
> поддержка Zod v4 при использовании Kubb `v3.8.1`, см. [Zod 4 migration guide](https://v4.zod.dev/v4/changelog)

## Установка

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

## Опции

### output

Указывает местоположение экспорта файлов и определяет поведение вывода.

#### output.path

Путь к выходной папке или файлу, который будет содержать сгенерированный код.

> [!TIP]
> если `output.path` является файлом, `group` не может быть использован.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `true`   |
|  Default: | `'zod'`  |

#### output.barrelType

Определяет, что нужно экспортировать, здесь вы также можете отключить экспорт barrel-файлов.

> [!TIP]
> использование propagate предотвратит создание barrel-файла плагином, но он всё равно будет распространяться, позволяя [`output.barrelType`](/ru/getting-started/configure#output-barreltype) экспортировать конкретную функцию или тип.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                                    |
|  Default: | `'named'`                                  |

<!--@include: ../core/barrelTypes.md-->

#### output.banner

Добавляет текст баннера в начало каждого файла.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.footer

Добавляет текст футера в конец каждого файла.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

### contentType

<!--@include: ../core/contentType.md-->

### group

<!--@include: ../core/group.md-->

#### group.type

Определяет тип, по которому нужно группировать файлы.

|           |         |
| --------: | :------ |
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Возвращает имя группы на основе имени группы, это будет использоваться для генерации имени файла и имени.

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

Использование TypeScript(`@kubb/plugin-ts`) для добавления аннотации типа.

> [!IMPORTANT]
> мы полагаемся на [`tozod`](https://github.com/colinhacks/tozod) от создателя Zod для создания схемы на основе типа.
> Kubb содержит свою собственную версию для такого рода преобразований.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### inferred

Возврат сгенерированной схемы Zod в виде типа с z.infer.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dateType

Выбор между использованием `date` или `datetime` как JavaScript `Date` вместо `string`.<br/>
См. [datetimes](https://zod.dev/?id=datetimes).

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

Какой тип использовать, когда файл Swagger/OpenAPI не предоставляет больше информации.

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

Какой тип использовать для значений пустой схемы.

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

Использование z.coerce.string() вместо z.string().
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

Какая версия Zod должна быть использована.

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

Настраивает имена на основе типа, предоставленного плагином.

|           |                                                |
| --------: | :--------------------------------------------- |
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                        |

```typescript
type ResolveType = "file" | "function" | "type" | "const";
```

#### transformers.schema

Настраивает схему на основе типа, предоставленного плагином.

|           |                                                                                                                             |
| --------: | :-------------------------------------------------------------------------------------------------------------------------- |
|     Type: | `(props: { schema?: SchemaObject; name?: string; parentName?: string}, defaultSchemas: Schema[],) => Schema[] \| undefined` |
| Required: | `false`                                                                                                                     |

### wrapOutput

Изменяет сгенерированную схему zod.

> [!TIP]
> это полезно для случаев, когда вам нужно расширить сгенерированный вывод zod дополнительными свойствами из схемы OpenAPI. Например, в случае `OpenAPI -> Zod -> OpenAPI`, вы можете включить примеры из схемы для данного свойства, а затем в конечном итоге предоставить модифицированную схему маршрутизатору, который поддерживает генерацию спецификации zod и OpenAPI.

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

## Пример

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

## Ссылки

- [Zod](https://zod.dev/)
