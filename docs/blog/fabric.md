---
layout: doc

title: Introducing Fabric — a flexible way to create and shape files
outline: deep
date: 2025-11-01
summary: Fabric is a lightweight, plugin‑first library for generating, transforming, and organizing files.
---

Published: 2025-11-01

# Introducing Fabric

Fabric is a new library from the `Kubb` ecosystem that focuses on easily creating files.

Where `Kubb` popularized “code generation as a workflow,” `Fabric` narrows the core to a small, composable runtime that:
- Treats every output as a file (with metadata and sources)
- Lets you transform and write files
- Stays framework‑agnostic, with integrations (e.g. `React`)

### Core concepts

At the heart of `Fabric` are a few simple ideas.

- A Fabric file contains a `path`, a `baseName`, and one or more `sources`. You can create files anywhere in your working tree and compose their content from multiple sources.

- A `Fabric` instance holds the context for a single run: the files you add, the plugins you install, and the write flow. Plugins hook into lifecycle events like `write:start` to analyze or emit extra files.

- Fabric is intentionally small, with plugins to extend Fabric's functionalities. For example:
  - `fsPlugin` writes files to disk
  - `barrelPlugin` can produce index barrels (`.index.ts`)
  - `graphPlugin` emits a `graph.json` + `graph.html` so you can visualize relationships between files
  - React integration (`react-fabric`) powers use cases like component scaffolding


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

```ts [scripts/build.ts]
import { createFabric, createFile } from '@kubb/fabric-core'
import { fsPlugin } from '@kubb/fabric-core/plugins'

async function main() {
  const fabric = createFabric()

  // Install the filesystem writer
  fabric.use(fsPlugin)

  // Create a file with one or more sources
  const readme = createFile({
    baseName: 'README.md',
    path: 'dist/README.md',
    sources: [
      { name: 'intro', value: '# Hello from Fabric\n' },
      { name: 'usage', value: 'Generated with Fabric.\n' },
    ],
  })

  await fabric.addFile(readme)

  // Trigger write flow
  await fabric.write()
}

main()
```
Run it and you’ll find your generated `dist/README.md`.

### A practical walkthrough: composing files like Lego

Let’s step through a more complete example that shows how Fabric’s core and plugins work together.

We’ll generate:
- A small client folder (`client/`) with a request utility and a typed API file
- An optional barrel file to export public APIs
- A file graph you can open in the browser to visualize the output

```ts
import path from 'node:path'
import { createFabric, createFile } from '@kubb/fabric-core'
import { barrelPlugin, graphPlugin, fsPlugin } from '@kubb/fabric-core/plugins'

async function buildClient() {
  const outDir = path.resolve('dist/client')
  const app = createFabric()

  // Write to disk
  app.use(fsPlugin)

  // Optional: generate an index barrel when files are written
  app.use(barrelPlugin)

  // Optional: generate a file graph and open it in the browser
  fabric.use(graphPlugin, { root: 'src', open: false })

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
      },
    ],
  })

  const apiFile = createFile({
    baseName: 'api.ts',
    path: path.join(outDir, 'api.ts'),
    sources: [
      {
        name: 'api',
        value: `import { request } from './request'

export type Todo = { id: number; title: string; completed: boolean }

export async function getTodos() {
  return request<Todo[]>('/api/todos')
}
`,
      },
    ],
  })

  await app.addFile(requestFile, apiFile)

  await app.write()

  console.log('Client generated at', outDir)
}

buildClient()
```

When the `write` lifecycle runs, each plugin gets a chance to:
- Inspect the files
- Create additional files (like `graph.json` / `graph.html`)
- Transform or aggregate content
- Finally, persist to disk via `fsPlugin`

The `graphPlugin` can drop a `graph.html` page next to your output. Open it to visualize how files relate, which is great for debugging larger generation scripts.

### React integration: react‑fabric

Fabric is runtime‑agnostic, but we provide an optional `react-fabric` package to make UI‑centric generation feel natural. It gives you:
- A `createReactFabric` helper to bootstrap React based generation
- A `reactPlugin` that understands React‑specific conventions
- A friendly way to compose UI templates as components and emit them as files

Here’s a tiny example that scaffolds a React component and its story:

```tsx [scripts/generateComponent.tsx]
import path from 'node:path'
import { fsPlugin } from '@kubb/react-fabric/plugins'
import { createReactFabric, createFile } from '@kubb/react-fabric'

function ComponentTemplate({ name }: { name: string }) {
  return (
    <>
      {`import React from 'react'\n\nexport type ${name}Props = { label: string }\n\nexport function ${name}({ label }: ${name}Props) {\n  return <div>{label}</div>\n}\n`}
    </>
  )
}

async function main() {
  const outDir = path.resolve('dist/components/Button')

  // Standard Fabric Fract
  const fabric = createReactFabric()
  fabric.use(fsPlugin)

  // Render React templates to strings and wrap as files
  const component = () => {
    return <ComponentTemplate name={"test"} />
  }

  fabric.render(component)

  await fabric.write()
}

main()
```

A few nice properties of this approach:
- You can reuse React components as code templates without a custom template language
- Composition is just composition — props control variants, and you can nest templates
- You still get the same Fabric lifecycle and plugins for organization and output


### Why Fabric?

- Composable first: small primitives to build exactly what you need
- Observable: inspect files before they hit disk, visualize with the graph plugin
- Extensible: add plugins for your team’s conventions
- Framework‑agnostic: bring your own rendering (React, plain strings, or anything else)


### What’s next

Fabric is young, and we’re actively collecting feedback. If you try it:
- Share what you built and which plugins you used
- Suggest integrations you’d love to see next


### TL;DR
- Fabric is a focused library for creating and organizing files
- It uses a plugin lifecycle to transform and write output
- React integration (`react-fabric`) makes UI codegen ergonomic
- The graph plugin helps you understand complex outputs at a glance

Give it a spin, and let us know what you generate!
