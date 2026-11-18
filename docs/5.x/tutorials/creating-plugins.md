---
layout: doc
title: Create a Kubb plugin - Write and test a generator
description: Build a Kubb plugin that writes the method and path of one API operation to a file, then test its output in memory with createKubb and Vitest.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Create a plugin
  icon: i-iconoir-ev-plug
---

# Create a Kubb plugin

Your first plugin writes the method and path of one API operation to `listPets.ts`, and a test checks its output in memory. You need npm, a Node.js version from [Prerequisites](/docs/5.x/introduction/installation#prerequisites), and some TypeScript.

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

Every authoring API comes from `kubb/kit`, which ships with `kubb`.

## Add the spec {#_2-add-the-specification}

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

In `setup`, register a resolver and a generator with the [setup context](/docs/5.x/reference/kit/plugins#setup-context) composables `setResolver` and `addGenerator`, then return the options:

```typescript [src/plugin.ts]
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

Kubb calls `operation` once per operation. Each call returns one file with a comment naming the HTTP method and path. The resolver turns the `operationId` into the file name.

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

The output is `// GET /pets`.

## Test the output {#_5-test-the-output}

Run the build in memory with an inline spec. `createKubb` from `kubb` applies the same adapter and parser defaults as `defineConfig`.

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

Vitest reports one passing test. The file never touches the disk.

::

## Continue

::card-group

:::card{title="How plugins work" icon="i-iconoir-ev-plug" to="/docs/5.x/introduction/architecture#plugins"}
Generators, resolvers, macros, the lifecycle, and dependencies.
:::

:::card{title="Generator reference" icon="i-iconoir-code" to="/docs/5.x/reference/kit/generators"}
Handler signatures, `match`, and the `ctx` properties.
:::

:::card{title="Publish a plugin" icon="i-iconoir-upload" to="/docs/5.x/how-to/publish-a-plugin"}
Ship it to npm and list it in the Kubb registry.
:::

::
