---
layout: doc
title: Create a Kubb plugin
description: Build a Kubb plugin that writes the method and path of one OpenAPI operation to a file, then test its output in memory with createKubb and Vitest.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Create a plugin
  icon: i-iconoir-ev-plug
---

# Create a Kubb plugin

Build a plugin that writes `listPets.ts` containing the method and path of one API operation, then test its output. You need Node.js 22.12 or higher, npm, and TypeScript knowledge.

::steps{level="2"}

## Create a project {#_1-create-a-project}

```shell [Terminal]
mkdir kubb-first-plugin
cd kubb-first-plugin
npm init -y
npm pkg set type=module
npm install -D kubb typescript @types/node vitest
mkdir src
```

All authoring APIs come from `kubb/kit`, included with `kubb`.

## Add the specification {#_2-add-the-specification}

Create `petStore.yaml` in the project root:

```yaml [petStore.yaml]
openapi: 3.0.3
info:
  title: Pets
  version: 1.0.0
paths:
  /pets:
    get:
      operationId: listPets
      responses:
        '200':
          description: A list of pets
```

## Create the plugin {#_3-create-the-plugin}

`defineExtension` with `kind: 'plugin'` takes the plugin's `meta` and a `setup` function. Register a generator and resolver in `setup` with the `setResolver` and `addGenerator` [composables](/docs/5.x/reference/kit/plugins#setup-context), then return the plugin's options:

```typescript twoslash [src/plugin.ts]
import { addGenerator, ast, createResolver, defineExtension, defineGenerator, setResolver } from 'kubb/kit'

const resolver = createResolver({ pluginName: 'plugin-example' })

const operationsGenerator = defineGenerator({
  name: 'operation-comments',
  operation(node, ctx) {
    const name = ctx.resolver.name(node.operationId)
    return [
      ast.factory.createFile({
        baseName: `${name}.ts`,
        path: `${ctx.root}/${name}.ts`,
        sources: [
          ast.factory.createSource({
            nodes: [ast.factory.createText(`// ${node.method} ${node.path}\n`)],
          }),
        ],
      }),
    ]
  },
})

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example', version: '1.0.0' },
  setup(options) {
    setResolver(resolver)
    addGenerator(operationsGenerator)
    return options
  },
})
```

The `operation` handler writes a comment containing the operation's HTTP method and path.

## Generate {#_4-generate}

Register the plugin in your config:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginExample } from './src/plugin'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginExample()],
})
```

```shell [Terminal]
npx kubb generate
```

Read the generated file:

```shell [Terminal]
node -e "console.log(require('node:fs').readFileSync('src/gen/listPets.ts', 'utf8'))"
```

It contains a comment naming `GET` and `/pets`.

## Test the output {#_5-test-the-output}

Run an in-process build with memory storage and a small fixture. `createKubb` from `kubb` supplies the same adapter and parser defaults as `defineConfig`.

```typescript [src/plugin.test.ts]
import { describe, expect, it } from 'vitest'
import { createKubb } from 'kubb'
import { memoryStorage } from 'kubb/kit'
import { pluginExample } from './plugin'

const input = {
  openapi: '3.0.3',
  info: { title: 'Pets', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        responses: { '200': { description: 'A list of pets' } },
      },
    },
  },
}

describe('pluginExample', () => {
  it('emits an operation comment', async () => {
    const { files, storage } = await createKubb({
      input,
      output: { path: './gen' },
      storage: memoryStorage(),
      plugins: [pluginExample()],
    }).build()

    const file = files.find((file) => file.baseName === 'listPets.ts')
    expect(file).toBeDefined()
    expect(await storage.readItem(file!.path)).toContain('/pets')
  })
})
```

Run the test:

```shell [Terminal]
npx vitest run src/plugin.test.ts
```

Vitest reports one passing test. It checks the generated file in memory without writing to disk.

::
