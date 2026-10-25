---
layout: doc
title: JSX renderer
description: The kubb/jsx surface backed by @kubb/renderer-jsx. jsxRenderer, the
  built-in components, and the JSX runtime for component-based code generation.
outline:
  - 2
  - 3
order: 5
navigation:
  title: JSX
  icon: i-iconoir-code
---

# JSX renderer

`kubb/jsx` is Kubb's JSX-based renderer, an alternative to building files with the `ast.factory` node builders from [`kubb/kit`](/docs/5.x/reference/kit). It provides a JSX runtime and a set of built-in components so a generator can emit files and markdown through JSX.

## Renderers {#renderers}

A renderer turns the elements a generator returns into `FileNode`s. Set it on a generator through its `renderer` field (`renderer: jsxRenderer`). Leave the field unset, or pass `renderer: null`, when the generator builds `FileNode`s with `ast.factory` directly.

`jsxRenderer` does not use React. Components run as plain functions, so hooks and suspense are not available.

`createRenderer` from `kubb/kit` takes a builder function and returns a factory that produces a `Renderer`. Use it only for a different templating format.

## Setup

Point your `tsconfig.json` at the `kubb/jsx` runtime so JSX syntax compiles against its components instead of React's:

```json [tsconfig.json]
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "kubb/jsx"
  }
}
```

With that in place, `.tsx` files in the plugin resolve `jsx-runtime` and `jsx-dev-runtime` from `kubb/jsx` automatically.

## `jsxRenderer()`

`jsxRenderer` creates a renderer instance with two members, `render` and `files`. Call `render` with a JSX element, then read the generated files back off `files`.

```tsx [render.tsx]
import { jsxRenderer } from 'kubb/jsx'
import { File, Function, Type } from 'kubb/jsx'

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

Core components declare an output file and its imports, exports, and source blocks. JavaScript components emit TypeScript declarations. Markdown components emit markdown. `Jsx` embeds a raw JSX string.

| Component | Category | Emits |
| --- | --- | --- |
| [`File`](#file) | Core | File entry |
| [`File.Source`](#file-source) | Core | Source block |
| [`File.Import`](#file-import) | Core | Import statement |
| [`File.Export`](#file-export) | Core | Export statement |
| [`Const`](#const) | JavaScript | TypeScript |
| [`Function`](#function) | JavaScript | TypeScript |
| [`Function.Arrow`](#function-arrow) | JavaScript | TypeScript |
| [`Type`](#type) | JavaScript | TypeScript |
| [`Callout`](#callout) | Markdown | Markdown |
| [`Frontmatter`](#frontmatter) | Markdown | Markdown |
| [`Heading`](#heading) | Markdown | Markdown |
| [`List`](#list) | Markdown | Markdown |
| [`Paragraph`](#paragraph) | Markdown | Markdown |
| [`Jsx`](#jsx-component) | JSX | Raw JSX |

### Core

`File` is the container. Its members `File.Source`, `File.Import`, and `File.Export` attach source blocks, imports, and exports to it.

#### `File` {#file}

Declares a generated output file. Pass both `baseName` and `path` to register a file entry. Omit both to render the children inline without creating a file.

| Prop | Type | Description |
| --- | --- | --- |
| `baseName` | `` `${string}.${string}` `` | File name with extension, such as `petStore.ts`. |
| `path` | `string` | Fully qualified path to the generated file. |
| `meta?` | `object \| null` | Metadata attached to the file node for plugins to read. |
| `banner?` | `string \| null` | Text prepended before the source blocks. |
| `footer?` | `string \| null` | Text appended after the source blocks. |
| `copy?` | `string \| null` | Absolute path to copy verbatim into the output, bypassing the parser. |
| `children?` | `KubbReactNode` | Source blocks, imports, and exports that make up the file. |

```tsx
<File baseName="petStore.ts" path="src/models/petStore.ts">
  <File.Source name="Pet" isExportable isIndexable>
    {`export type Pet = { id: number; name: string }`}
  </File.Source>
</File>
```

#### `File.Source` {#file-source}

Marks a block of source text that belongs to the enclosing `File`. The children are the source string.

| Prop | Type | Description |
| --- | --- | --- |
| `name?` | `string \| null` | Identifies the source for deduplication and barrel generation. |
| `isExportable?` | `boolean \| null` | Prepend the `export` keyword. |
| `isIndexable?` | `boolean \| null` | Include the source in barrel and index generation. |
| `isTypeOnly?` | `boolean \| null` | Mark the source as a type-only export. |
| `inline?` | `{ expression: string } \| null` | Let importing files absorb the source instead of importing it. |
| `children?` | `KubbReactNode` | Source text of the block. |

```tsx
<File.Source name="PetId" isTypeOnly isExportable>
  {`export type PetId = string`}
</File.Source>
```

`inline.expression` is the right-hand side of the declaration. When every source in a file is inline, Kubb does not write that file. Before barrels are built, it replaces each name another file imports from it with `(expression)`, and moves over the imports the expression needs.

```tsx
<File.Source name="AddPetStatus200" isTypeOnly isExportable inline={{ expression: 'Pet' }}>
  {`export type AddPetStatus200 = Pet`}
</File.Source>
```

#### `File.Import` {#file-import}

Declares an import for the enclosing `File`. The renderer emits it at the top of the generated file.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string \| Array<string \| { propertyName: string; name?: string }>` | Binding to import. A string for a default or namespace import, an array for named imports. |
| `path` | `string` | Module specifier to import from. |
| `root?` | `string \| null` | Root used to resolve the import path relative to the file. |
| `isTypeOnly?` | `boolean \| null` | Emit `import type`. |
| `isNameSpace?` | `boolean \| null` | Emit `import * as name`. |

```tsx
<File.Import name={['useState']} path="react" />
// import { useState } from 'react'

<File.Import name="z" path="zod" isNameSpace />
// import * as z from 'zod'
```

#### `File.Export` {#file-export}

Declares an export for the enclosing `File`. The renderer emits it at the top of the generated file.

| Prop | Type | Description |
| --- | --- | --- |
| `name?` | `string \| Array<string> \| null` | Binding to export. Omit for a wildcard export. |
| `path` | `string` | Module specifier to export from. |
| `isTypeOnly?` | `boolean \| null` | Emit `export type`. |
| `asAlias?` | `boolean \| null` | Emit `export * as name`. |

```tsx
<File.Export name={['Pet']} path="./models/petStore" />
// export { Pet } from './models/petStore'

<File.Export path="./models/petStore" isTypeOnly />
// export type * from './models/petStore'
```

### JavaScript

The JavaScript components emit TypeScript declarations. Nest them inside a `File.Source` so the renderer writes them into a `.ts` file.

#### `Const` {#const}

Generates a TypeScript constant declaration. The children are the initializer expression.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | Identifier of the constant. |
| `export?` | `boolean \| null` | Prepend the `export` keyword. |
| `type?` | `string \| null` | Type annotation written after `const name:`. |
| `asConst?` | `boolean \| null` | Append `as const` after the initializer. |
| `JSDoc?` | `JSDoc \| null` | JSDoc block prepended to the declaration. |
| `children?` | `KubbReactNode` | Initializer expression. |

```tsx
<Const export name="petSchema" type="z.ZodType<Pet>">
  {`z.object({ id: z.number() })`}
</Const>
// export const petSchema: z.ZodType<Pet> = z.object({ id: z.number() })
```

#### `Function` {#function}

Generates a TypeScript function declaration. The children are the function body.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | Identifier of the function. |
| `export?` | `boolean \| null` | Prepend the `export` keyword. |
| `default?` | `boolean \| null` | Emit `default` after `export` to make this the default export. |
| `async?` | `boolean \| null` | Emit `async`. Wraps `returnType` in `Promise<…>`. |
| `params?` | `string \| null` | Parameter list written between the parentheses. |
| `generics?` | `string \| Array<string> \| null` | Generic type parameters. An array joins with commas. |
| `returnType?` | `string \| null` | Return type annotation written after `:`. |
| `JSDoc?` | `JSDoc \| null` | JSDoc block prepended to the declaration. |
| `children?` | `KubbReactNode` | Function body. |

```tsx
<Function export async name="getPet" generics={['TData = Pet']} params="petId: string" returnType="TData">
  {'return client.get("/pets/" + petId)'}
</Function>
// export async function getPet<TData = Pet>(petId: string): Promise<TData> { … }
```

#### `Function.Arrow` {#function-arrow}

Generates an arrow function assigned to a `const`. Takes every `Function` prop plus `singleLine`.

| Prop | Type | Description |
| --- | --- | --- |
| `singleLine?` | `boolean \| null` | Render a braceless expression body instead of a block. |

```tsx
<Function.Arrow export name="double" params="n: number" returnType="number" singleLine>
  {`n * 2`}
</Function.Arrow>
// export const double = (n: number): number => n * 2
```

#### `Type` {#type}

Generates a TypeScript type alias. The children are the type expression. `name` must start with an uppercase letter or the component throws.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | Identifier of the type alias, starting with an uppercase letter. |
| `export?` | `boolean \| null` | Prepend the `export` keyword. |
| `JSDoc?` | `JSDoc \| null` | JSDoc block prepended to the declaration. |
| `children?` | `KubbReactNode` | Type expression on the right-hand side. |

```tsx
<Type export name="PetId">
  {`string | number`}
</Type>
// export type PetId = string | number
```

### Markdown

The markdown components each emit their own source block, so they go directly inside a `File` rather than a `File.Source`. Render the file with `parserMd` so it is written as markdown.

```tsx [docs.tsx]
import { jsxRenderer } from 'kubb/jsx'
import { File, Frontmatter, Heading, Paragraph, List, Callout } from 'kubb/jsx'

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

Renders a GitHub-style alert using the `> [!TYPE]` blockquote syntax.

| Prop | Type | Description |
| --- | --- | --- |
| `type` | `'tip' \| 'note' \| 'important' \| 'warning' \| 'caution'` | Callout kind, mapped to the uppercase label. |
| `title?` | `string \| null` | Title rendered on the marker line. |
| `children` | `string` | Body text. Each line is quoted with `> `. |

```tsx
<Callout type="warning" title="Heads up">Breaking change in v6.</Callout>
// > [!WARNING] Heads up
// > Breaking change in v6.
```

#### `Frontmatter` {#frontmatter}

Emits a YAML frontmatter envelope at the top of a markdown file. Place it as the first child of the `File`.

| Prop | Type | Description |
| --- | --- | --- |
| `data` | `Record<string, unknown>` | Object serialized to YAML between `---` fences. |

```tsx
<Frontmatter data={{ title: 'Pets', layout: 'doc' }} />
// ---
// title: Pets
// layout: doc
// ---
```

#### `Heading` {#heading}

Renders an ATX-style markdown heading.

| Prop | Type | Description |
| --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | Heading depth, matching the number of `#` characters. |
| `children` | `string` | Heading text. |

```tsx
<Heading level={2}>Installation</Heading>
// ## Installation
```

#### `List` {#list}

Renders a markdown list, one entry per line.

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `ReadonlyArray<string>` | List entries, one per line. |
| `ordered?` | `boolean \| null` | Emit a numbered list. Defaults to a bullet list. |

```tsx
<List ordered items={['First', 'Second']} />
// 1. First
// 2. Second
```

#### `Paragraph` {#paragraph}

Renders a markdown paragraph. Inline markdown passes through verbatim.

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `string` | Paragraph text. |

```tsx
<Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
```

### JSX

#### `Jsx` {#jsx-component}

Embeds a raw JSX string in the generated source, including fragments. Use it inside a `Function` to emit a component body. The children must be a plain string.

| Prop | Type | Description |
| --- | --- | --- |
| `children?` | `string` | Raw JSX string embedded verbatim. |

```tsx
<Function name="MyComponent" export>
  <Jsx>{'return (\n  <>\n    <div>Hello</div>\n  </>\n)'}</Jsx>
</Function>
```
