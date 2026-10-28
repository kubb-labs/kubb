import { isMainThread } from 'node:worker_threads'
import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type Adapter, type Config, memoryStorage, type Output, type Plugin, runGenerateWorker } from '@kubb/core'

/**
 * The input and config `generateWorker.test.ts` runs on the main thread and in its worker threads,
 * which Node starts from this file. Every schema and operation asks the resolver for the same name,
 * so a range generated on its own hands out `shared`, `shared2`, ... again and the main thread has
 * to replay the names before the output matches one walk.
 */
export const schemas: Array<SchemaNode> = Array.from({ length: 6 }, (_, index) =>
  ast.factory.createSchema({ type: 'object', name: `Model${index}`, pointer: `#/components/schemas/Model${index}` }),
)
export const operations: Array<OperationNode> = Array.from({ length: 5 }, (_, index) =>
  ast.factory.createOperation({ operationId: `operation${index}`, method: 'GET', path: `/items/${index}`, pointer: `#/paths/~1items~1${index}/get` }),
)

const OUTPUT: Output = { path: './gen', mode: 'directory' }

export function createFixtureConfig(): Config {
  const adapter: Adapter = {
    name: 'oas',
    options: {},
    document: null,
    parse: async () => {
      // Generators read the source document through `ctx.adapter`, so a thread has to receive it with the input.
      adapter.document = { title: 'fixture' }
      return ast.factory.createInput({ schemas, operations })
    },
    validate: async () => {},
  }
  const plugin: Plugin = {
    name: 'fixture',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.addGenerator({
          name: 'fixture',
          schema(node, { resolver, root, warn, adapter }) {
            const name = resolver.resolveName({ key: ['shared', node.name!], name: 'shared' })
            if (node.name === 'Model4') warn(`Model4 took ${name}`)
            const { title } = adapter.document as { title: string }
            const file = resolver.file({ name: node.name!, extname: '.ts', root, output: OUTPUT })
            return [
              {
                ...file,
                sources: [
                  ast.factory.createSource({ name, isExportable: true, nodes: [ast.factory.createText(`export const ${name} = '${node.name} of ${title}'`)] }),
                ],
              },
            ]
          },
          operation(node, { resolver, root }) {
            const name = resolver.resolveName({ key: ['shared', node.operationId], name: 'shared' })
            // Every operation lands in one file, so same-path sources must keep their walk order.
            const file = resolver.file({ name: 'operations', extname: '.ts', root, output: OUTPUT })
            return [
              {
                ...file,
                sources: [
                  ast.factory.createSource({ name, isExportable: true, nodes: [ast.factory.createText(`export const ${name} = '${node.operationId}'`)] }),
                ],
              },
            ]
          },
          operations(nodes, { resolver, root }) {
            // Runs on the main thread, which has to continue the numbering where the ranges left off.
            const name = resolver.resolveName({ key: ['shared', 'all'], name: 'shared' })
            const file = resolver.file({ name: 'all', extname: '.ts', root, output: OUTPUT })
            return [{ ...file, sources: [ast.factory.createSource({ name, nodes: [ast.factory.createText(`export const ${name} = ${nodes.length}`)] })] }]
          },
        })
      },
    },
  }

  return {
    root: '.',
    input: './petStore.yaml',
    output: { path: OUTPUT.path },
    parsers: [],
    reporters: [],
    adapter,
    plugins: [plugin],
    storage: memoryStorage(),
  }
}

if (!isMainThread) await runGenerateWorker(createFixtureConfig())
