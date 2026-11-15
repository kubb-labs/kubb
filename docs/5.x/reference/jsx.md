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

`kubb/jsx` lets a generator describe its files as JSX instead of `ast.factory` node builders from [`kubb/kit`](/docs/5.x/reference/kit).

## Renderers {#renderers}

A renderer turns what a generator returns into `FileNode`s. Set `renderer: jsxRenderer` on the generator. Leave `renderer` unset, or `null`, when the generator returns `FileNode`s from `ast.factory`.

```mermaid
flowchart LR
  gen[Generator returns JSX] --> renderer[jsxRenderer]:::core
  renderer --> nodes[FileNode list]
  nodes --> parser[Parser, such as parserTs]
  parser --> out[Generated file]
```

> [!NOTE]
> `jsxRenderer` does not use React. Components run once as plain functions, so hooks, suspense, and class components do not work.

For another template format, build a renderer with `createRenderer` from `kubb/kit`. It takes a factory that returns `{ render, files, [Symbol.dispose] }`.

## Setup

Point `tsconfig.json` at the `kubb/jsx` runtime, so JSX compiles against its components instead of React:

```json [tsconfig.json]
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "kubb/jsx"
  }
}
```

## `jsxRenderer()`

`jsxRenderer()` returns a renderer. Call `render` with a JSX element, then read the `FileNode`s from `files`.

```tsx [render.tsx]
import { File, Function, Type, jsxRenderer } from 'kubb/jsx'

const renderer = jsxRenderer()

await renderer.render(
  <File baseName="petStore.ts" path="src/gen/petStore.ts">
    <File.Source>
      <Type name="Pet">{'{ id: number; name: string }'}</Type>
      <Function name="getPet" async>
        {"return fetch('/pets')"}
      </Function>
    </File.Source>
  </File>,
)

const files = renderer.files
```

## Built-in components

| Component | Group | Emits |
| --- | --- | --- |
| [`File`](#file) | Core | A file entry |
| [`File.Source`](#file-source) | Core | A source block |
| [`File.Import`](#file-import) | Core | An import statement |
| [`File.Export`](#file-export) | Core | An export statement |
| [`Const`](#const) | JavaScript | A `const` declaration |
| [`Function`](#function) | JavaScript | A function declaration |
| [`Function.Arrow`](#function-arrow) | JavaScript | An arrow function in a `const` |
| [`Type`](#type) | JavaScript | A type alias |
| [`Callout`](#callout) | Markdown | A GitHub alert |
| [`Frontmatter`](#frontmatter) | Markdown | A YAML frontmatter block |
| [`Heading`](#heading) | Markdown | A heading |
| [`List`](#list) | Markdown | A list |
| [`Paragraph`](#paragraph) | Markdown | A paragraph |
| [`Jsx`](#jsx-component) | JSX | A raw JSX string |

Inside a code component or `File.Source`, `<br />` adds a line break.

### Core

#### `File` {#file}

Declares a generated file when it has both `baseName` and `path`. Without them, it renders its children inline. Text directly in a `File`, outside `File.Source`, throws an error.

| Prop | Type | Description |
| --- | --- | --- |
| `baseName` | `` `${string}.${string}` `` | The file name with its extension, such as `petStore.ts` |
| `path` | `string` | The full path of the generated file |
| `meta?` | `object \| null` | Metadata on the file node, for plugins to read |
| `banner?` | `string \| null` | Text before the source blocks |
| `footer?` | `string \| null` | Text after the source blocks |
| `copy?` | `string \| null` | An absolute path of a file to copy into the output. See [Copied and inline files](/docs/5.x/topics/config-and-inputs#inline-sources). |
| `children?` | `KubbReactNode` | The sources, imports, and exports of the file |

```tsx
<File baseName="petStore.ts" path="src/models/petStore.ts">
  <File.Source name="Pet" isExportable isIndexable>
    {`export type Pet = { id: number; name: string }`}
  </File.Source>
</File>
```

#### `File.Source` {#file-source}

A block of source text in the enclosing `File`. The children are the text.

| Prop | Type | Description |
| --- | --- | --- |
| `name?` | `string \| null` | Names the source for deduplication and barrels |
| `isExportable?` | `boolean \| null` | Marks an exported declaration. The text still needs its own `export`. |
| `isIndexable?` | `boolean \| null` | Includes the source in barrels |
| `isTypeOnly?` | `boolean \| null` | Marks a type-only export |
| `inline?` | `{ expression: string } \| null` | Lets importing files use `expression` in place of the name |
| `pointer?` | `string` | Where the source comes from in the input, such as `#/components/schemas/Pet` |
| `children?` | `KubbReactNode` | The source text |

See [Copied and inline files](/docs/5.x/topics/config-and-inputs#inline-sources) for `inline`.

#### `File.Import` {#file-import}

An import at the top of the enclosing `File`.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string \| Array<string \| { propertyName: string; name?: string }>` | A string for a default or namespace import, an array for named imports |
| `path` | `string` | The module to import from |
| `root?` | `string \| null` | The file path the import resolves relative to |
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
| `name?` | `string \| Array<string> \| null` | The names to export. Leave it out for a wildcard export. |
| `path` | `string` | The module to export from |
| `isTypeOnly?` | `boolean \| null` | Emits `export type` |
| `asAlias?` | `boolean \| null` | Emits `export * as name` |

```tsx
<File.Export name={['Pet']} path="./models/petStore" />
// export { Pet } from './models/petStore'

<File.Export path="./models/petStore" isTypeOnly />
// export type * from './models/petStore'
```

### JavaScript

These components emit TypeScript inside a `File.Source`. Each takes `export?: boolean | null` to add `export`, and `JSDoc?: { comments?: Array<string | undefined> } | null` for a JSDoc block above the declaration.

#### `Const` {#const}

A `const` declaration. The children are the initializer.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The constant's name |
| `type?` | `string \| null` | The type annotation after `const name:` |
| `asConst?` | `boolean \| null` | Adds `as const` after the initializer |

```tsx
<Const export name="petSchema" type="z.ZodType<Pet>">
  {`z.object({ id: z.number() })`}
</Const>
// export const petSchema: z.ZodType<Pet> = z.object({ id: z.number() })
```

#### `Function` {#function}

A function declaration. The children are the body.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The function's name |
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

An arrow function assigned to a `const`. It takes every `Function` prop, plus `singleLine?: boolean | null` for an expression body without braces.

```tsx
<Function.Arrow export name="double" params="n: number" returnType="number" singleLine>
  {`n * 2`}
</Function.Arrow>
// export const double = (n: number): number => n * 2
```

#### `Type` {#type}

A type alias. The children are the type. `name` must start with an uppercase letter, or the component throws.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The alias name, starting with an uppercase letter |

```tsx
<Type export name="PetId">
  {`string | number`}
</Type>
// export type PetId = string | number
```

### Markdown

Each Markdown component emits its own source block, so put it directly inside a `File`, not a `File.Source`. Give the file a `.md` name so `parserMd` prints it.

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

YAML frontmatter between `---` fences. Make it the first child of the `File`. An empty `data` object prints nothing.

| Prop | Type | Description |
| --- | --- | --- |
| `data` | `Record<string, unknown>` | The object to write as YAML |

#### `Heading` {#heading}

An ATX heading, such as `## Installation` for `<Heading level={2}>Installation</Heading>`.

| Prop | Type | Description |
| --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | The number of `#` characters |
| `children` | `string` | The heading text |

#### `List` {#list}

A list with one item per line.

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `ReadonlyArray<string>` | The items |
| `ordered?` | `boolean \| null` | Numbers the items `1.`, `2.`, and so on. Default: a `-` bullet list. |

#### `Paragraph` {#paragraph}

A paragraph. Inline Markdown passes through as written.

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `string` | The paragraph text |

### JSX

#### `Jsx` {#jsx-component}

Embeds a raw JSX string, fragments included, such as a component body inside a `Function`. The children must be one plain string.

| Prop | Type | Description |
| --- | --- | --- |
| `children?` | `string` | The JSX source, written as is |

```tsx
<Function name="MyComponent" export>
  <Jsx>{'return (\n  <>\n    <div>Hello</div>\n  </>\n)'}</Jsx>
</Function>
```
