---
layout: doc
title: JSX renderer - kubb/jsx component reference
description: "Reference for kubb/jsx, backed by @kubb/renderer-jsx: the jsxRenderer, the tsconfig setup, and the props of every built-in component."
outline:
  - 2
  - 3
order: 5
navigation:
  title: JSX
  icon: i-iconoir-code
---

# JSX renderer

`kubb/jsx` lets you write a generator's files as JSX instead of [`ast.factory`](/docs/5.x/reference/kit/ast#factory-functions) node builders.

## Renderers {#renderers}

A renderer turns what a generator returns into `FileNode`s. Set `renderer: jsxRenderer` on the generator. Leave `renderer` unset or `null` when it returns `FileNode`s from `ast.factory`.

```mermaid
flowchart LR
  gen[Generator returns JSX] --> renderer[jsxRenderer]:::core
  renderer --> nodes[FileNode list]
  nodes --> parser[Parser, such as parserTs]
  parser --> out[Generated file]
```

> [!NOTE]
> `jsxRenderer` does not use React. Components run once as plain functions, so hooks, suspense, and class components do not work.

For another template format, pass `createRenderer` from `kubb/kit` a factory that returns `{ render, files, [Symbol.dispose] }`.

## Setup

Point `tsconfig.json` at the `kubb/jsx` runtime instead of React:

```json [tsconfig.json]
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "kubb/jsx"
  }
}
```

## `jsxRenderer()`

`jsxRenderer()` returns a renderer. Call `render` with a JSX element, then read `files`.

```tsx [render.tsx]
import { File, Function, Type, jsxRenderer } from 'kubb/jsx'

const renderer = jsxRenderer()

await renderer.render(
  <File baseName="petStore.ts" path="src/gen/petStore.ts">
    <Type export name="Pet">{'{ id: number; name: string }'}</Type>
    <Function export name="getPet" async>
      {"return fetch('/pets')"}
    </Function>
  </File>,
)

const files = renderer.files
```

## Built-in components

| Group | Components |
| --- | --- |
| [Core](#core) | [`File`](#file), [`Code`](#code), [`Raw`](#raw), [`Origin`](#origin), [`File.Import`](#file-import), [`File.Export`](#file-export), [`Schema`](#schema) |
| [JavaScript](#javascript) | [`Const`](#const), [`Function`](#function), [`Function.Arrow`](#function-arrow), [`Type`](#type) |
| [Markdown](#markdown) | [`Callout`](#callout), [`Frontmatter`](#frontmatter), [`Heading`](#heading), [`List`](#list), [`Paragraph`](#paragraph) |
| [JSX](#jsx) | [`Jsx`](#jsx-component) |

Inside a code component, `Code` or `Raw`, `<br />` adds a line break.

### Choose a component {#choose-a-component}

Everything inside a `File` is an import, an export, or a source block. Pick the source block by what the content is:

| The content is | Use | Barrels list it |
| --- | --- | --- |
| A declaration you write in JSX | [`Const`](#const), [`Type`](#type) or [`Function`](#function) with `export` | Yes, when exported |
| A declaration a printer or a template already printed | [`Code`](#code) with `export` | Yes, when exported |
| Text that declares nothing, such as a statement or JSON | [`Raw`](#raw) | No |
| Markdown | A [Markdown component](#markdown) | No |

### Core

#### `File` {#file}

With `baseName` and `path`, `File` declares a generated file. Without them, it renders its children inline. Text directly in a `File`, outside `Code` or `Raw`, throws.

| Prop | Type | Description |
| --- | --- | --- |
| `baseName` | `` `${string}.${string}` `` | The file name, such as `petStore.ts` |
| `path` | `string` | The full output path |
| `meta?` | `object \| null` | Metadata for plugins to read |
| `banner?` | `string \| null` | Text before the source blocks |
| `footer?` | `string \| null` | Text after the source blocks |
| `copy?` | `string \| null` | An absolute path of a file to copy into the output |
| `inline?` | `boolean \| null` | Never writes the file. Files that import from it get each declaration's body in place of its name. |
| `children?` | `KubbReactNode` | The file's sources, imports, and exports |

```tsx
<File baseName="petStore.ts" path="src/models/petStore.ts">
  <Type export name="Pet">
    {`{ id: number; name: string }`}
  </Type>
</File>
```

#### `Code` {#code}

A printed declaration in the enclosing `File`, such as a schema from a printer or a class built as text. It works for any language. For a declaration written in JSX, or a TypeScript type, put a [JavaScript component](#javascript) directly in the `File`.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The declared name, for barrels and deduplication |
| `export?` | `boolean` | Lists the declaration in barrels. The text still needs its own `export`. |
| `default?` | `boolean` | Marks the declaration as the default export, which barrels skip |
| `children?` | `KubbReactNode` | The printed declaration |

```tsx
<File baseName="pet.ts" path="src/gen/pet.ts">
  <Code name="petSchema" export>
    {printer.print(node)}
  </Code>
</File>
```

#### `Raw` {#raw}

Text in the enclosing `File` that declares nothing, such as a statement like `faker.seed(1)`, JSON, or markdown. Barrels leave it out.

| Prop | Type | Description |
| --- | --- | --- |
| `name?` | `string` | Keys deduplication, so a block several generators add to one file is written once |
| `children?` | `KubbReactNode` | The text, written as is |

```tsx
<File baseName="pet.ts" path="src/gen/pet.ts">
  <File.Import name={['faker']} path="@faker-js/faker" />
  <Raw name="faker-seed">{'faker.seed(1)'}</Raw>
</File>
```

#### `Origin` {#origin}

Records where the sources inside it come from in the input, so tools can link generated code back to it. openapi-import uses this for go to definition. It works for every source block in a `File`, in any language.

You only need it when one generator writes code for several parts of the input. Without it, a source gets the location of the node being generated. An inner `Origin` wins over an outer one.

| Prop | Type | Description |
| --- | --- | --- |
| `pointer?` | `string` | The input location, in the form the adapter reads, such as `#/paths/~1pets/get/responses/200` |
| `children?` | `KubbReactNode` | The sources it applies to |

```tsx
<File baseName="getPets.ts" path="src/gen/getPets.ts">
  <Type export name="GetPetsResponses">
    {printer.print(responses)}
  </Type>
  <Origin pointer={response.pointer}>
    <Type export name="GetPetsStatus200">
      {printer.print(response.schema)}
    </Type>
  </Origin>
</File>
```

#### `File.Source` {#file-source}

Deprecated, removed in Kubb v6. Replace it by what it wraps: `Code` for a printed declaration, `Raw` for anything else, or the JSX component itself when it wraps `Const`, `Type` or `Function`.

```diff
- <File.Source name="Pet" isExportable isIndexable isTypeOnly>{printed}</File.Source>
+ <Type export name="Pet">{printedBody}</Type>

- <File.Source name="petSchema" isExportable isIndexable>{printed}</File.Source>
+ <Code name="petSchema" export>{printed}</Code>

- <File.Source name="faker-seed">{'faker.seed(1)'}</File.Source>
+ <Raw name="faker-seed">{'faker.seed(1)'}</Raw>

- <File.Source name="getPet" isExportable isIndexable>
-   <Function export name="getPet">{body}</Function>
- </File.Source>
+ <Function export name="getPet">{body}</Function>
```

#### `File.Import` {#file-import}

An import at the top of the enclosing `File`.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string \| Array<string \| { propertyName: string; name?: string }>` | A string for a default or namespace import, or an array of named imports |
| `path` | `string` | The module to import from |
| `root?` | `string \| null` | The file path the import is relative to |
| `isTypeOnly?` | `boolean \| null` | Emits `import type` |
| `isNameSpace?` | `boolean \| null` | Emits `import * as name` |

```tsx
<File.Import name={['useState']} path="react" />
// import { useState } from 'react'

<File.Import name="z" path="zod" isNameSpace />
// import * as z from 'zod'
```

#### `File.Export` {#file-export}

An export at the top of the enclosing `File`.

| Prop | Type | Description |
| --- | --- | --- |
| `name?` | `string \| Array<string> \| null` | The names to export, or none for a wildcard export |
| `path` | `string` | The module to export from |
| `isTypeOnly?` | `boolean \| null` | Emits `export type` |
| `asAlias?` | `boolean \| null` | Emits `export * as name` |

```tsx
<File.Export name={['Pet']} path="./models/petStore" />
// export { Pet } from './models/petStore'

<File.Export path="./models/petStore" isTypeOnly />
// export type * from './models/petStore'
```

#### `Schema` {#schema}

Prints `node`, adds the printer's imports, and calls `children` with the code. It renders nothing when the printer returns nothing.

| Prop | Type | Description |
| --- | --- | --- |
| `node` | `SchemaNode` | The schema to print |
| `printer` | `Printer` | The printer, such as one built with `createPrinter` |
| `children` | `(code: string) => KubbReactNode` | Renders the declarations for the code |

```tsx
<Schema node={node} printer={printer}>
  {(code) => (
    <Const export name="petSchema">
      {code}
    </Const>
  )}
</Schema>
```

### JavaScript

The JavaScript components emit TypeScript. Each takes `export?: boolean | null` to add `export`, and `JSDoc?: { comments?: Array<string | undefined> } | null` for a JSDoc block.

A component directly in a `File` is its own source block, named after `name`. `export` puts it in barrels, unless it is also `default`. In an [`inline` file](#inline-sources), importing files use its body in place of its name.

```tsx
<File baseName="pet.ts" path="src/zod/pet.ts">
  <Const export name="petSchema">{'z.object({ id: z.number() })'}</Const>
  <Type export name="Pet">{'z.infer<typeof petSchema>'}</Type>
</File>
```

#### `Const` {#const}

A `const` declaration, with the children as the initializer.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name |
| `type?` | `string \| null` | The annotation after `const name:` |
| `asConst?` | `boolean \| null` | Adds `as const` after the initializer |

```tsx
<Const export name="petSchema" type="z.ZodType<Pet>">
  {`z.object({ id: z.number() })`}
</Const>
// export const petSchema: z.ZodType<Pet> = z.object({ id: z.number() })
```

#### `Function` {#function}

A function declaration, with the children as the body.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name |
| `default?` | `boolean \| null` | Adds `default` after `export` |
| `async?` | `boolean \| null` | Adds `async` and wraps `returnType` in `Promise<…>` |
| `params?` | `string \| null` | The parameter list |
| `generics?` | `string \| Array<string> \| null` | The type parameters. An array joins with commas. |
| `returnType?` | `string \| null` | The return type after `:` |

```tsx
<Function export async name="getPet" generics={['TData = Pet']} params="petId: string" returnType="TData">
  {'return client.get("/pets/" + petId)'}
</Function>
// export async function getPet<TData = Pet>(petId: string): Promise<TData> { … }
```

#### `Function.Arrow` {#function-arrow}

An arrow function in a `const`. It takes every `Function` prop, plus `singleLine?: boolean | null` for an expression body without braces.

```tsx
<Function.Arrow export name="double" params="n: number" returnType="number" singleLine>
  {`n * 2`}
</Function.Arrow>
// export const double = (n: number): number => n * 2
```

#### `Type` {#type}

A type alias or an interface, with the children as the type. `name` must start with an uppercase letter, or `Type` throws. Barrels re-export it with `export type`.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The alias name |
| `syntax?` | `'type' \| 'interface'` | `'interface'` declares `interface Name { … }`, so the children must be an object type. Defaults to `'type'`. |

```tsx
<Type export name="PetId">
  {`string | number`}
</Type>
// export type PetId = string | number

<Type export name="Pet" syntax="interface">
  {`{ id: number }`}
</Type>
// export interface Pet { id: number }
```

### Markdown

Each Markdown component emits its own source block, so put it directly in a `File`, not in `Code` or `Raw`. Name the file `.md` so `parserMd` prints it.

```tsx [docs.tsx]
import { Callout, File, Frontmatter, Heading, List, Paragraph, jsxRenderer } from 'kubb/jsx'

const renderer = jsxRenderer()

await renderer.render(
  <File baseName="pets.md" path="src/docs/pets.md">
    <Frontmatter data={{ title: 'Pets', layout: 'doc' }} />
    <Heading level={2}>Pets</Heading>
    <Paragraph>{'A pet object with an id and a name.'}</Paragraph>
    <List items={['id: number', 'name: string']} />
    <Callout type="tip">Keep the generator hot with kubb generate --watch.</Callout>
  </File>,
)
```

#### `Callout` {#callout}

A GitHub alert in `> [!TYPE]` syntax.

| Prop | Type | Description |
| --- | --- | --- |
| `type` | `'tip' \| 'note' \| 'important' \| 'warning' \| 'caution'` | The alert kind, printed in uppercase |
| `title?` | `string \| null` | Text on the marker line |
| `children` | `string` | The body. Each line gets a `> ` prefix. |

```tsx
<Callout type="warning" title="Heads up">Breaking change in v6.</Callout>
// > [!WARNING] Heads up
// > Breaking change in v6.
```

#### `Frontmatter` {#frontmatter}

YAML frontmatter between `---` fences, as the first child of the `File`. An empty `data` prints nothing.

| Prop | Type | Description |
| --- | --- | --- |
| `data` | `Record<string, unknown>` | The object to write as YAML |

#### `Heading` {#heading}

An ATX heading, such as `## Installation` for `level={2}`.

| Prop | Type | Description |
| --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | The number of `#` characters |
| `children` | `string` | The heading text |

#### `List` {#list}

A list with one item per line.

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `ReadonlyArray<string>` | The items |
| `ordered?` | `boolean \| null` | Numbers the items `1.`, `2.`, and so on. Default: a `-` list. |

#### `Paragraph` {#paragraph}

A paragraph. Inline Markdown passes through as written.

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `string` | The paragraph text |

### JSX

#### `Jsx` {#jsx-component}

Embeds a raw JSX string, fragments included, such as a component body in a `Function`. The children must be one plain string.

| Prop | Type | Description |
| --- | --- | --- |
| `children?` | `string` | The JSX source, written as is |

```tsx
<Function name="MyComponent" export>
  <Jsx>{'return (\n  <>\n    <div>Hello</div>\n  </>\n)'}</Jsx>
</Function>
```

## Less common cases {#less-common-cases}

### Inline sources {#inline-sources}

When a plugin writes a `File` with `copy` or `inline`, Kubb copies or absorbs it instead of printing it.

- `copy` is an absolute path to copy into the output, through the parser's `copy` hook if it has one. Its sources count for barrels but are not printed.
- `inline` means Kubb never writes the file. Each file that imports a name from it gets that declaration's body, from a `Const`, `Type` or `Function`, together with the imports the body needs.

```tsx
<File baseName="AddPet.ts" path="src/gen/models/AddPet.ts" inline>
  <Type export name="AddPetStatus200">
    {'Pet'}
  </Type>
</File>
```

`inline` on `Const`, `Type` and `Function` is deprecated and removed in Kubb v6. Set it on the `File`.

The parser's `inline` member (`InlineLanguage`) runs before barrels. It finds names (`replaceIdentifiers`) and makes a definition safe to put where a name was (`wrap`). Only files of a parser with `inline`, such as `parserTs`, absorb inline sources.

With the `kubb/jsx` [setup](#setup), `.tsx` files load `jsx-runtime` and `jsx-dev-runtime` from `kubb/jsx`.
