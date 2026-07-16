import { ast, type FileNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KubbDriver } from './KubbDriver.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, GeneratorContext, KubbHooks, KubbPluginSetupContext, Plugin } from './types.ts'
import type { Generator } from './defineGenerator.ts'
import { Hookable } from './Hookable.ts'

function fileNode(path: string): FileNode {
  return ast.factory.createFile({ baseName: path.split('/').at(-1) as `${string}.${string}`, path })
}

function inputAdapter() {
  const schemas: Array<SchemaNode> = [
    ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] }),
    ast.factory.createSchema({ type: 'object', name: 'Store', properties: [] }),
  ]
  const operations: Array<OperationNode> = [
    ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet' }),
    ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' }),
  ]
  return createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations }) })
}

type Recorder = {
  schema: Array<{ plugin: string; name: string | null | undefined }>
  operation: Array<{ plugin: string; id: string }>
  operations: Array<{ plugin: string; count: number }>
}

// A generator that records every call and emits one file per node, prefixed by plugin name so the
// produced file set proves which plugin's generator ran for which node.
function recordingGenerator(pluginName: string, rec: Recorder): Generator {
  return {
    name: `${pluginName}-gen`,
    schema(node: SchemaNode, ctx: GeneratorContext) {
      rec.schema.push({ plugin: ctx.plugin.name, name: node.name })
      return [fileNode(`${pluginName}/schema-${node.name}.ts`)]
    },
    operation(node: OperationNode, ctx: GeneratorContext) {
      rec.operation.push({ plugin: ctx.plugin.name, id: node.operationId })
      return [fileNode(`${pluginName}/op-${node.operationId}.ts`)]
    },
    operations(nodes: Array<OperationNode>, ctx: GeneratorContext) {
      rec.operations.push({ plugin: ctx.plugin.name, count: nodes.length })
      return [fileNode(`${pluginName}/operations.ts`)]
    },
  }
}

function makePlugin(name: string, rec: Recorder): Plugin {
  return {
    name,
    hooks: {
      'kubb:plugin:setup'(ctx: KubbPluginSetupContext) {
        ctx.addGenerator(recordingGenerator(name, rec))
      },
    },
  } as unknown as Plugin
}

describe('KubbDriver generator dispatch', () => {
  let rec: Recorder
  let driver: KubbDriver
  let hooks: Hookable<KubbHooks>

  const build = async () => {
    rec = { schema: [], operation: [], operations: [] }
    hooks = new Hookable<KubbHooks>()
    const config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [makePlugin('pluginA', rec), makePlugin('pluginB', rec)],
      storage: memoryStorage(),
    } satisfies Config
    driver = new KubbDriver(config, { hooks })
    await driver.setup()
  }

  beforeEach(build)
  afterEach(() => hooks.removeAllHooks())

  it('runs each plugin generator once per node, scoped to its own plugin', async () => {
    await driver.run()

    expect(rec.schema).toStrictEqual([
      { plugin: 'pluginA', name: 'Pet' },
      { plugin: 'pluginA', name: 'Store' },
      { plugin: 'pluginB', name: 'Pet' },
      { plugin: 'pluginB', name: 'Store' },
    ])
    expect(rec.operation).toStrictEqual([
      { plugin: 'pluginA', id: 'getPet' },
      { plugin: 'pluginA', id: 'listPets' },
      { plugin: 'pluginB', id: 'getPet' },
      { plugin: 'pluginB', id: 'listPets' },
    ])
    expect(rec.operations).toStrictEqual([
      { plugin: 'pluginA', count: 2 },
      { plugin: 'pluginB', count: 2 },
    ])
  })

  it('collects one file per generator return, keyed by plugin and node', async () => {
    await driver.run()

    expect(driver.fileManager.files.map((file) => file.path).sort()).toStrictEqual([
      'pluginA/op-getPet.ts',
      'pluginA/op-listPets.ts',
      'pluginA/operations.ts',
      'pluginA/schema-Pet.ts',
      'pluginA/schema-Store.ts',
      'pluginB/op-getPet.ts',
      'pluginB/op-listPets.ts',
      'pluginB/operations.ts',
      'pluginB/schema-Pet.ts',
      'pluginB/schema-Store.ts',
    ])
  })

  it('emits the public generate hooks to external listeners, once per plugin-node pair', async () => {
    const onSchema = vi.fn()
    const onOperation = vi.fn()
    const onOperations = vi.fn()
    hooks.hook('kubb:generate:schema', onSchema)
    hooks.hook('kubb:generate:operation', onOperation)
    hooks.hook('kubb:generate:operations', onOperations)

    await driver.run()

    expect(onSchema).toHaveBeenCalledTimes(4)
    expect(onOperation).toHaveBeenCalledTimes(4)
    expect(onOperations).toHaveBeenCalledTimes(2)
  })

  it('fires kubb:plugin:end for every plugin with success', async () => {
    const onPluginEnd = vi.fn()
    hooks.hook('kubb:plugin:end', onPluginEnd)

    await driver.run()

    const ended = onPluginEnd.mock.calls.map(([ctx]) => ({ name: ctx.plugin.name, success: ctx.success }))
    expect(ended).toStrictEqual([
      { name: 'pluginA', success: true },
      { name: 'pluginB', success: true },
    ])
  })

  it('stops a throwing plugin without aborting the rest', async () => {
    rec = { schema: [], operation: [], operations: [] }
    hooks = new Hookable<KubbHooks>()
    const boomPlugin = {
      name: 'boom',
      hooks: {
        'kubb:plugin:setup'(ctx: KubbPluginSetupContext) {
          ctx.addGenerator({
            name: 'boom-gen',
            schema() {
              throw new Error('boom in schema')
            },
          })
        },
      },
    } as unknown as Plugin
    const config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [boomPlugin, makePlugin('after', rec)],
      storage: memoryStorage(),
    } satisfies Config
    const boomDriver = new KubbDriver(config, { hooks })
    await boomDriver.setup()

    const { diagnostics } = await boomDriver.run()

    // The plugin after the failing one still runs every node.
    expect(rec.schema.map((entry) => entry.name)).toStrictEqual(['Pet', 'Store'])
    expect(diagnostics.some((diagnostic) => 'plugin' in diagnostic && diagnostic.plugin === 'boom')).toBe(true)
    hooks.removeAllHooks()
  })

  it('normalizes plugin options after setup even when setOptions is never called', async () => {
    const localHooks = new Hookable<KubbHooks>()
    const plugin = {
      name: 'opts-plugin',
      options: { output: { path: 'types' }, enumType: 'asConst' },
      hooks: {},
    } as unknown as Plugin
    const config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [plugin],
      storage: memoryStorage(),
    } satisfies Config
    const optsDriver = new KubbDriver(config, { hooks: localHooks })
    await optsDriver.setup()
    await optsDriver.run()

    const normalized = optsDriver.plugins.get('opts-plugin')!.options
    expect(normalized.output).toStrictEqual({ path: 'types', mode: 'file' })
    expect(normalized.exclude).toStrictEqual([])
    expect(normalized.override).toStrictEqual([])
    expect((normalized as Record<string, unknown>).enumType).toBe('asConst')
    localHooks.removeAllHooks()
  })
})
