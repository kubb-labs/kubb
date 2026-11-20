import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import {
  type Config,
  defineExtension as coreDefineExtension,
  type GeneratorContext,
  Hookable,
  KubbDriver,
  type KubbHooks,
  memoryStorage,
  type Plugin,
} from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { addGenerator, addMacro, setResolver } from './composables.ts'
import { defineExtension } from './defineExtension.ts'

function adapter() {
  const schemas: Array<SchemaNode> = [
    ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [], pointer: '#/components/schemas/Pet' }),
    ast.factory.createSchema({ type: 'object', name: 'Store', properties: [], pointer: '#/components/schemas/Store' }),
    ast.factory.createSchema({ type: 'object', name: 'Unused', properties: [], pointer: '#/components/schemas/Unused' }),
  ]
  const operations: Array<OperationNode> = [
    ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet', tags: ['pet'] }),
    ast.factory.createOperation({ operationId: 'getStore', method: 'GET', path: '/store', tags: ['store'] }),
  ]
  return createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations }) })
}

async function build(plugins: Array<Plugin>) {
  const config: Config = {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: adapter(),
    plugins,
    storage: memoryStorage(),
  }
  const driver = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })
  await driver.setup()
  const { diagnostics } = await driver.run()
  return { driver, diagnostics, files: driver.fileManager.files.map((file) => file.path).sort() }
}

function examplePlugin(define: typeof coreDefineExtension, log: Array<string>, include?: Array<{ type: 'tag'; pattern: string }>) {
  return define({
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
  it('produces the same files and calls as the core path', async () => {
    const coreLog: Array<string> = []
    const kitLog: Array<string> = []

    const core = await build([examplePlugin(coreDefineExtension, coreLog)])
    const kit = await build([examplePlugin(defineExtension, kitLog)])

    expect(kit.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toStrictEqual([])
    expect(kitLog).toStrictEqual(coreLog)
    expect(kit.files).toStrictEqual(core.files)
    expect(kitLog).toStrictEqual(['schema:ApiPet:macro', 'schema:ApiStore:macro', 'schema:ApiUnused:macro', 'operation:getPet', 'operations:getPet,getStore'])
  })

  it('filters operations and prunes schemas like the core path', async () => {
    const coreLog: Array<string> = []
    const kitLog: Array<string> = []
    const include = [{ type: 'tag' as const, pattern: 'pet' }]

    const core = await build([examplePlugin(coreDefineExtension, coreLog, include)])
    const kit = await build([examplePlugin(defineExtension, kitLog, include)])

    expect(kitLog).toStrictEqual(coreLog)
    expect(kit.files).toStrictEqual(core.files)
    expect(kitLog).toStrictEqual(['operation:getPet', 'operations:getPet'])
  })

  it('keeps generators and the resolver in memo on the kit path', async () => {
    const { driver } = await build([examplePlugin(defineExtension, [])])

    expect(driver.plugins.get('plugin-example')?.generators).toBeUndefined()
    expect(driver.getResolver('plugin-example').name('Pet')).toBe('ApiPet')
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
})
