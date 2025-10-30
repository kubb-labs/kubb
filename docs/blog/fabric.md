---
layout: doc

title: Introducing Fabric — a flexible way to create and shape files
outline: deep
date: 2025-11-01
summary: Fabric is a language-agnostic toolkit for generating code and files using JSX and TypeScript.
---

Published: 2025-11-01

# Introducing Fabric

Fabric is a new library from the `Kubb` ecosystem that focuses on easily creating files.

While `Kubb` popularized the idea of “code generation as a workflow,” `Fabric` focuses on making file creation effortless:
- The core of Fabric orchestrates file generation, combining multiple files into one, managing files (with a queue), and intelligently merging or deduplicating imports and exports.
- Extensible through custom plugins and parsers, with built-in support for `TypeScript`, `JavaScript`, and `JSX/TSX`.
- Transform and write files to the filesystem seamlessly using the `fsPlugin`.
- Use `React` to define files through JSX components, offering a declarative and composable approach to file generation.
```tsx
<File path={'/gen/name.ts'} baseName={'name.ts'}>
  <File.Source>
    <Const export name={'name'}>"fabric"</Const>
  </File.Source>
</File>
```

### Core concepts

At the heart of `Fabric` are a few simple ideas.

- A `Fabric` instance holds the context: the files you add, the plugins and parsers you install. Plugins can hook into lifecycle events like `write:start` to analyze or emit extra files.
- Fabric is intentionally small, with plugins to extend Fabric's functionalities. For example:
  - `fsPlugin` writes files to disk
  - `barrelPlugin` can produce index barrels (`.index.ts`)
  - `graphPlugin` emits a `graph.json` + `graph.html` so you can visualize relationships between files
  - React integration (`react-fabric`) to easily create files with JSX components

### Quick start

Install Fabric

::: code-group
```shell [bun]
bun add -d @kubb/fabric-core
```

```shell [pnpm]
pnpm add -D @kubb/fabric-core
```

```shell [npm]
npm install --save-dev @kubb/fabric-core
```

```shell [yarn]
yarn add -D @kubb/fabric-core
```
:::

Create a simple script that generates a couple of files:
::: code-group
```ts [build.ts]
import path from "node:path"
import process from "node:process"

import { createFabric, createFile } from '@kubb/fabric-core'
import { fsPlugin } from '@kubb/fabric-core/plugins'

async function main() {
  const fabric = createFabric()

  // Install the filesystem writer
  fabric.use(fsPlugin)

  // Create a file with one or more sources
  const readme = createFile({
    baseName: 'README.md',
    path: path.join(process.cwd(), 'dist/README.md'),
    sources: [
      { name: 'intro', value: '# Hello from Fabric' },
      { name: 'usage', value: 'Generated with Fabric.' },
    ],
  })

  // add file to the FileManager queue
  await fabric.addFile(readme)

  // Trigger write flow
  await fabric.write()
}

main()
```
```markdown [dist/README.md]
# Hello from Fabric

Generated with Fabric.
```
:::
Run it and you’ll find your generated `dist/README.md`.

### A practical walkthrough: composing files like Lego

Let’s step through a more complete example that shows how Fabric’s core and plugins work together.

We’ll generate:
- A generated folder (`gen/`) with a request utility and a typed API file
- An optional barrel file to export public APIs
- A file graph you can open in the browser to visualize the output

::: code-group
```ts [build.ts]
import path from 'node:path'
import process from 'node:process'

import { createFabric, createFile } from '@kubb/fabric-core'
import { barrelPlugin, graphPlugin, fsPlugin } from '@kubb/fabric-core/plugins'
import { typescriptParser } from '@kubb/fabric-core/parsers'

async function build() {
  const root = path.join(process.cwd())
  const outDir = path.join(root, 'gen')
  const fabric = createFabric()

  // use TypeScript
  fabric.use(typescriptParser)

  // Write to disk
  fabric.use(fsPlugin)

  // Optional: generate an index barrel when files are written
  fabric.use(barrelPlugin, { root, mode: 'named' })

  // Optional: generate a file graph and open it in the browser
  fabric.use(graphPlugin, { root, open: false })

  const requestFile = createFile({
    baseName: 'request.ts',
    path: path.join(outDir, 'request.ts'),
    sources: [
      {
        name: 'request',
        value: `export async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error('Request failed')
  return res.json() as Promise<T>
}
`,
        isExportable: true,
        isIndexable: true,
      },
    ],
  })

  const apiFile = createFile({
    baseName: 'api.ts',
    path: path.join(outDir, 'api.ts'),
    imports: [
      {
        name: ['request'],
        path: './request',
      }
    ],
    sources: [
      {
        name: 'getTodos',
        value: `export type Todo = { id: number; title: string; completed: boolean }

export async function getTodos() {
  return request<Todo[]>('/api/todos')
}
`,
        isExportable: true,
        isIndexable: true,
      },
    ],
  })

  await fabric.addFile(requestFile, apiFile)

  await fabric.write()
}

build()
```
```ts [gen/index.ts]
export { request } from "./request.ts"
export { getTodos } from "./api.ts"
```
```ts [gen/request.ts]
export async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error('Request failed')
  return res.json() as Promise<T>
}
```

```ts [gen/api.ts]
import { request } from './request'

export type Todo = { id: number; title: string; completed: boolean }

export async function getTodos() {
  return request<Todo[]>('/api/todos')
}
```
:::

When the `write` lifecycle runs, each plugin gets a chance to:
- Inspect the files
- Create additional files (like `graph.json` / `graph.html`)
- Transform or aggregate content
- Finally, persist to disk via `fsPlugin`

The `graphPlugin` can drop a `graph.html` page next to your output. Open it to visualize how files relate, which is great for debugging larger generation scripts.

### React integration: react‑fabric

Fabric also contains a package called `react-fabric` so you can use JSX components and syntax to create files.
- A `createReactFabric` helper to replace `createFabric` creator
- A `reactPlugin` that will add `fabric.render` and `fabric.renderToString`

Here’s a tiny example that uses React components to create files.

::: code-group

```tsx [build.tsx]
import path from 'node:path'
import process from 'node:process'

import { fsPlugin } from '@kubb/react-fabric/plugins'
import { createReactFabric, File, Const } from '@kubb/react-fabric'
import { typescriptParser } from "@kubb/react-fabric/parsers"

async function build() {
  const root = path.join(process.cwd())
  const outDir = path.join(root, 'gen')

  const fabric = createReactFabric()

  // use TypeScript
  fabric.use(typescriptParser)
  // Write to disk
  fabric.use(fsPlugin)

  // Render React templates to strings and wrap as files
  const component = () => {
    return (
      <File path={path.resolve(outDir, 'name.ts')} baseName={'name.ts'}>
        <File.Source>
          <Const export asConst name={'name'}>
            "fabric"
          </Const>
        </File.Source>
      </File>
    )
  }

  fabric.render(component)

  await fabric.write()
}

build()
```

```ts [gen/name.ts]
export const name = 'fabric' as const
```
:::

A few nice properties of this approach:
- You can reuse React components as code templates without a custom template language
- Easy to read code with a lot of out of the box components like `<File/>`, `<Const/>`, `<Const/>`, `<Type/>`, ...
- You still get the same Fabric lifecycle and plugins


### Why Fabric?
- Easy to use: Fabric orchestrates file creation and automatically queues tasks when needed.
- Runtime-aware: Fabric automatically uses the correct runtime code for `Bun` or `Node`.
- Extensible: Extend Fabric’s capabilities with plugins and parsers to support new features or languages.
- Framework-agnostic: Use your own renderer (like `React`) or stick to plain JavaScript with `createFile`.

### What’s next
Fabric is young, and we’re actively collecting feedback. If you try it:
- Share what you built and which plugins you used
- Suggest integrations you’d love to see next

### TL;DR
- Fabric is a focused library for creating and organizing files
- It uses a plugin lifecycle to transform and write output
- React integration (`react-fabric`) makes it possible to use JSX components to create files
- The graph plugin helps you understand complex outputs at a glance

Give it a spin, and let us know what you generate!
