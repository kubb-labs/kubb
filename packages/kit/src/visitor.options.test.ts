import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type Config, createKubb, Hookable, type KubbHooks, memoryStorage, type Plugin, setOptions } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { addGenerator, setMacros } from './composables.ts'
import { defineExtension } from './defineExtension.ts'
import type { Generator } from './types.ts'

async function build({ schemas = [], operations = [] }: { schemas?: Array<SchemaNode>; operations?: Array<OperationNode> }, plugin: Plugin) {
  const config: Config = {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations }) }),
    plugins: [plugin],
    storage: memoryStorage(),
  }
  await createKubb(config, { hooks: new Hookable<KubbHooks>() }).build()
}

function optionsPlugin(options: Record<string, unknown>, generator: Generator, macros: Array<ast.Macro> = []): Plugin {
  return defineExtension({
    kind: 'plugin',
    meta: { name: 'options-plugin' },
    hooks: {
      'kubb:plugin:setup'() {
        setOptions({ output: { path: '.' }, exclude: [], override: [], ...options } as never)
        setMacros(macros)
        addGenerator(generator)
      },
    },
  })()
}

const operation = (operationId: string, extra: Partial<OperationNode> = {}) =>
  ast.factory.createOperation({ operationId, method: 'GET', path: `/${operationId}`, parameters: [], responses: [], tags: [], ...extra })

describe('generatorVisitor options', () => {
  it('filters operations by vendor extension in exclude, include, and override', async () => {
    const operations = [
      operation('hidden', { extensions: { 'x-org-ignore': true } }),
      operation('shown', { extensions: { 'x-org-ignore': false, 'x-org-beta': 'yes' } }),
      operation('plain'),
    ]
    const run = async (options: Record<string, unknown>) => {
      const seen: Array<{ operationId: string; marker?: string }> = []
      await build(
        { operations },
        optionsPlugin(options, {
          name: 'extension-filter-gen',
          operation(node, ctx) {
            seen.push({ operationId: node.operationId, marker: (ctx.options as { marker?: string }).marker })
            return null
          },
        }),
      )
      return seen
    }

    expect((await run({ exclude: [{ type: 'extension', key: 'x-org-ignore', value: true }] })).map(({ operationId }) => operationId)).toEqual([
      'shown',
      'plain',
    ])
    expect((await run({ include: [{ type: 'extension', key: 'x-org-beta' }] })).map(({ operationId }) => operationId)).toEqual(['shown'])
    expect(await run({ override: [{ type: 'extension', key: 'x-org-ignore', options: { marker: 'flagged' } }] })).toEqual([
      { operationId: 'hidden', marker: 'flagged' },
      { operationId: 'shown', marker: 'flagged' },
      { operationId: 'plain', marker: undefined },
    ])
  })

  it('matches a method filter in either case', async () => {
    const operations = ['GET', 'POST'].map((method) => operation(method, { method: method as 'GET', path: '/pets' }))
    const run = async (pattern: string | RegExp) => {
      const seen: Array<string> = []
      await build(
        { operations },
        optionsPlugin(
          { include: [{ type: 'method', pattern }] },
          {
            name: 'method-filter-gen',
            operation: (node) => {
              seen.push(node.operationId)
              return null
            },
          },
        ),
      )
      return seen
    }

    for (const pattern of ['get', /get/]) expect(await run(pattern)).toEqual(['GET'])
    expect(await run('DELETE')).toEqual([])
    // A negative pattern written for the lowercase name keeps excluding the method.
    for (const pattern of [/^(?!get$)/, '^(?!GET$)']) expect(await run(pattern)).toEqual(['POST'])
  })

  it('gives an override output its mode', async () => {
    const seen: Array<unknown> = []
    await build(
      { schemas: ['A', 'B', 'C'].map((name) => ast.factory.createSchema({ name, type: 'string' })) },
      optionsPlugin(
        {
          output: { path: 'types' },
          override: [
            { type: 'schemaName', pattern: 'A', options: { output: { path: 'admin' } } },
            { type: 'schemaName', pattern: 'B', options: { output: { path: 'admin.ts' } } },
          ],
        },
        {
          name: 'override-output-gen',
          schema: (_node, ctx) => {
            seen.push((ctx.options as { output: unknown }).output)
            return null
          },
        },
      ),
    )

    expect(seen).toEqual([
      { path: 'admin', mode: 'directory' },
      { path: 'admin.ts', mode: 'file' },
      { path: 'types', mode: 'directory' },
    ])
  })

  it('passes the same transformed node to operation and operations generators', async () => {
    const perNode: Array<OperationNode> = []
    let batch: Array<OperationNode> = []
    await build(
      { operations: [operation('getPet', { path: '/pet' })] },
      optionsPlugin(
        {},
        {
          name: 'transform-gen',
          operation(node) {
            perNode.push(node)
            return null
          },
          operations(nodes) {
            batch = nodes
            return null
          },
        },
        [{ name: 'suffix-operation-id', operation: (node) => ({ ...node, operationId: `${node.operationId}X` }) }],
      ),
    )

    expect(perNode).toHaveLength(1)
    expect(batch).toHaveLength(1)
    expect(perNode[0]?.operationId).toBe('getPetX')
    expect(batch[0]).toBe(perNode[0])
  })
})
