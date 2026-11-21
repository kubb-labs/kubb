import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import {
  type Config,
  defineExtension as coreDefineExtension,
  Hookable,
  KubbDriver,
  type KubbHooks,
  memoryStorage,
  type Plugin,
  useKubb,
} from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { addGenerator, addMacro, getResolver, resolverFor, setPrinter, setResolver, slot } from './composables.ts'
import { defineExtension, definePlugin } from './defineExtension.ts'
import { Resolver } from './resolver/Resolver.ts'
import type { GeneratorContext } from './types.ts'

const ref = (name: string) => ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}` })

function adapter(meta?: { tags: Array<{ name: string; parent: string }> }) {
  const schemas: Array<SchemaNode> = [
    ast.factory.createSchema({
      type: 'object',
      name: 'Pet',
      properties: [ast.factory.createProperty({ name: 'store', required: false, schema: ref('Store') })],
      pointer: '#/components/schemas/Pet',
    }),
    ast.factory.createSchema({ type: 'object', name: 'Store', properties: [], pointer: '#/components/schemas/Store' }),
    ast.factory.createSchema({ type: 'object', name: 'Unused', properties: [], pointer: '#/components/schemas/Unused' }),
  ]
  const operations: Array<OperationNode> = [
    ast.factory.createOperation({
      operationId: 'getPet',
      method: 'GET',
      path: '/pet',
      tags: ['pet'],
      parameters: [ast.factory.createParameter({ name: 'pet', in: 'query', required: false, schema: ref('Pet') })],
    }),
    ast.factory.createOperation({ operationId: 'getStore', method: 'GET', path: '/store', tags: ['store'] }),
  ]
  return createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations, meta: meta ?? {} }) })
}

async function build(plugins: Array<Plugin>, meta?: Parameters<typeof adapter>[0]) {
  const config: Config = {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: adapter(meta),
    plugins,
    storage: memoryStorage(),
  }
  const driver = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })
  await driver.setup()
  const { diagnostics } = await driver.run()
  return { driver, diagnostics, files: driver.fileManager.files.map((file) => file.path).sort() }
}

function examplePlugin(log: Array<string>, include?: Array<{ type: 'tag'; pattern: string }>) {
  return defineExtension({
    kind: 'plugin',
    meta: { name: 'plugin-example' },
    setup(options) {
      setResolver({ name: (name: string) => `Api${name}` })
      addMacro({ name: 'suffix', schema: (node: SchemaNode) => ({ ...node, description: 'macro' }) })
      addGenerator({
        name: 'example',
        match: (node: SchemaNode | OperationNode) => !('operationId' in node) || node.operationId !== 'getStore',
        schema(node: SchemaNode, ctx: GeneratorContext) {
          log.push(`schema:${ctx.resolver.name(node.name ?? '')}:${node.description}`)
          return [ast.factory.createFile({ path: `gen/${ctx.resolver.name(node.name ?? '')}.ts`, baseName: 'x.ts', sources: [] })]
        },
        operation(node: OperationNode) {
          log.push(`operation:${node.operationId}`)
          return []
        },
        operations(nodes: Array<OperationNode>) {
          log.push(`operations:${nodes.map((node) => node.operationId).join(',')}`)
          return []
        },
      })
      return include ? { ...options, include } : options
    },
  })()
}

describe('generatorVisitor', () => {
  it('passes the setup context as this, ctx and useKubb() to a kit plugin setup', async () => {
    const seen: Array<boolean> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-this' },
      setup(options, ctx) {
        seen.push(this === ctx && useKubb() === ctx)
        return options
      },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          seen.push(this === ctx && useKubb() === ctx)
        },
      },
    })

    await build([plugin({})])

    expect(seen).toStrictEqual([true, true])
  })

  it('runs macros, the resolver, match and every generator kind', async () => {
    const log: Array<string> = []

    const { diagnostics, files } = await build([examplePlugin(log)])

    expect(diagnostics.filter((diagnostic) => diagnostic.severity !== 'info')).toStrictEqual([])
    expect(log).toStrictEqual(['schema:ApiPet:macro', 'schema:ApiStore:macro', 'schema:ApiUnused:macro', 'operation:getPet', 'operations:getPet,getStore'])
    expect(files).toStrictEqual(['gen/ApiPet.ts', 'gen/ApiStore.ts', 'gen/ApiUnused.ts'])
  })

  it('filters operations and prunes the schemas they do not reach', async () => {
    const log: Array<string> = []

    const { files } = await build([examplePlugin(log, [{ type: 'tag', pattern: 'pet' }])])

    expect(log).toStrictEqual(['schema:ApiPet:macro', 'schema:ApiStore:macro', 'operation:getPet', 'operations:getPet'])
    expect(files).toStrictEqual(['gen/ApiPet.ts', 'gen/ApiStore.ts'])
  })

  it('keeps generators and the resolver in memo', async () => {
    const { driver } = await build([examplePlugin([])])

    expect(driver.memo.get(slot.generators('plugin-example'))).toHaveLength(1)
    expect(resolverFor(driver.memo, 'plugin-example').name('Pet')).toBe('ApiPet')
    expect(getResolver({ memo: driver.memo }, 'plugin-example').name('Pet')).toBe('ApiPet')
    expect(getResolver({ memo: driver.memo }, 'plugin-missing').name('Pet')).toBe('pet')
  })

  it("runs generators of a plugin defined with kit's definePlugin", async () => {
    const log: Array<string> = []
    const plugin = definePlugin({
      meta: { name: 'plugin-define' },
      setup(options) {
        addGenerator({
          name: 'define',
          schema(node: SchemaNode) {
            log.push(node.name ?? '')
            return []
          },
        })
        return options
      },
    })()

    await build([plugin])

    expect(log).toStrictEqual(['Pet', 'Store', 'Unused'])
  })

  it('rejects kit composables in a plugin defined with core defineExtension', async () => {
    const plugin = coreDefineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-core' },
      setup(options) {
        addGenerator({ name: 'core', schema: () => null })
        return options
      },
    })()

    const { diagnostics } = await build([plugin])

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error', message: expect.stringContaining('`addGenerator()` was called for plugin "plugin-core"') }),
    )
  })

  it('runs a plugin visit hook after the kit visitor', async () => {
    const log: Array<string> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-own' },
      setup(options) {
        addGenerator({
          name: 'own',
          schema(node: SchemaNode) {
            log.push(`generator:${node.name}`)
            return []
          },
        })
        return options
      },
      hooks: {
        'kubb:plugin:visit:schema'(node) {
          log.push(`hook:${node.name}`)
        },
      },
    })()

    await build([plugin])

    expect(log.slice(0, 2)).toStrictEqual(['generator:Pet', 'hook:Pet'])
  })

  it('tags the memo resolver of a plugin without generators', async () => {
    const setTags = vi.spyOn(Resolver.prototype, 'setTags')
    const tags = [{ name: 'pet', parent: 'animals' }]
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-tags' },
      setup(options) {
        setResolver({ name: (name: string) => name })
        return options
      },
    })()

    const { driver } = await build([plugin], { tags })

    expect(setTags.mock.contexts).toContain(resolverFor(driver.memo, 'plugin-tags'))
    expect(setTags).toHaveBeenCalledWith(tags)
    setTags.mockRestore()
  })

  it('builds ctx.printer once per build and once per matching override', async () => {
    const built: Array<unknown> = []
    const seen: Array<[string, unknown]> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-printer' },
      setup(options) {
        setPrinter((ctx) => {
          const printer = { label: (ctx.options as { label?: string }).label }
          built.push(printer)
          return printer
        })
        addGenerator({
          name: 'printer',
          schema(node: SchemaNode, ctx: GeneratorContext) {
            seen.push([node.name ?? '', ctx.printer])
            return null
          },
        })
        return { ...options, override: [{ type: 'schemaName', pattern: '^Pet$', options: { label: 'pet' } }] }
      },
    })()

    await build([plugin])

    expect(built).toStrictEqual([{ label: 'pet' }, { label: undefined }])
    expect(seen.map(([name, printer]) => [name, built.indexOf(printer)])).toStrictEqual([
      ['Pet', 0],
      ['Store', 1],
      ['Unused', 1],
    ])
  })

  it('leaves ctx.printer undefined without setPrinter', async () => {
    const printers: Array<unknown> = []
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-no-printer' },
      setup(options) {
        addGenerator({
          name: 'no-printer',
          schema(_node: SchemaNode, ctx: GeneratorContext) {
            printers.push(ctx.printer)
            return null
          },
        })
        return options
      },
    })()

    await build([plugin])

    expect(printers).toStrictEqual([undefined, undefined, undefined])
  })
})
