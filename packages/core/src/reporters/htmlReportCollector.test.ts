import { ast, type InputNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { type ProblemDiagnostic, Diagnostics } from '../Diagnostics.ts'
import { memoryStorage } from '../storages/memoryStorage.ts'
import type { Config, KubbHooks } from '../types.ts'
import { Hookable } from '../Hookable.ts'
import { createHtmlReportCollector } from './htmlReportCollector.ts'

function config(): Config {
  return {
    name: 'petstore',
    root: '/workspace',
    input: './petstore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    plugins: [],
    storage: memoryStorage(),
  } as unknown as Config
}

function inputNode(names: Array<string>): InputNode {
  return ast.factory.createInput({
    meta: { title: 'Petstore', circularNames: [], enumNames: [] },
    schemas: names.map((name) => ast.factory.createSchema({ type: 'object', name, properties: [] })),
    operations: [],
  })
}

function plugin(name: string) {
  return { name } as KubbHooks['kubb:plugin:start'][0]['plugin']
}

function generatorContext(pluginName: string, cfg = config()) {
  return {
    config: cfg,
    plugin: plugin(pluginName),
  } as unknown as KubbHooks['kubb:generate:schema'][1]
}

function file(path: string) {
  return ast.factory.createFile({
    path,
    baseName: path.split('/').at(-1) as `${string}.${string}`,
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(`export const ${path.replaceAll(/[^a-z0-9]/gi, '_')} = true`)] })],
  })
}

describe('createHtmlReportCollector', () => {
  it('keeps the canonical AST separate from the plugin view', async () => {
    const hooks = new Hookable<KubbHooks>()
    const canonical = inputNode(['A', 'B', 'C'])
    const collector = createHtmlReportCollector({ hooks, getInputNode: () => canonical })
    const cfg = config()

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: canonical.meta,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-a') })
    await hooks.callHook('kubb:generate:schema', canonical.schemas[0]!, generatorContext('plugin-a', cfg))

    const snapshot = collector.getSnapshot()

    expect(snapshot.ast?.schemas.map((schema) => schema.name)).toStrictEqual(['A', 'B', 'C'])
    expect(snapshot.pluginViews['plugin-a']?.schemas.map((schema) => schema.name)).toStrictEqual(['A'])
    expect(snapshot.run?.schemaCount).toBe(3)
    expect(snapshot.run?.plugins[0]).toMatchObject({ name: 'plugin-a', schemaCount: 1 })
  })

  it('does not mutate the canonical AST when a plugin receives a transformed node', async () => {
    const hooks = new Hookable<KubbHooks>()
    const canonical = inputNode(['Pet'])
    const collector = createHtmlReportCollector({ hooks, getInputNode: () => canonical })
    const cfg = config()

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: canonical.meta,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-a') })
    await hooks.callHook('kubb:generate:schema', ast.factory.createSchema({ type: 'string', name: 'Pet' }), generatorContext('plugin-a', cfg))

    const snapshot = collector.getSnapshot()

    expect(snapshot.ast?.schemas[0]).toMatchObject({ name: 'Pet', type: 'object' })
    expect(snapshot.pluginViews['plugin-a']?.schemas[0]).toMatchObject({ name: 'Pet', type: 'string' })
  })

  it('records plugin lifecycle and associates schema and operation events with the plugin that received them', async () => {
    const hooks = new Hookable<KubbHooks>()
    const canonical = ast.factory.createInput({
      meta: { circularNames: [], enumNames: [] },
      schemas: [ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] })],
      operations: [ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pets/{petId}' })],
    })
    const collector = createHtmlReportCollector({ hooks, getInputNode: () => canonical })
    const cfg = config()

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: canonical.meta,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-a') })
    await hooks.callHook('kubb:generate:schema', canonical.schemas[0]!, generatorContext('plugin-a', cfg))
    await hooks.callHook('kubb:generate:operation', canonical.operations[0]!, generatorContext('plugin-a', cfg))
    await hooks.callHook('kubb:plugin:end', {
      plugin: plugin('plugin-a'),
      duration: 12,
      success: true,
      config: cfg,
      files: [],
      upsertFile: () => [],
    })

    const snapshot = collector.getSnapshot()

    expect(snapshot.run?.plugins).toStrictEqual([{ name: 'plugin-a', status: 'success', duration: 12, error: null, schemaCount: 1, operationCount: 1 }])
    expect(snapshot.pluginViews['plugin-a']?.operations.map((operation) => operation.operationId)).toStrictEqual(['getPet'])
  })

  it('preserves multiple plugin executions in order without overwriting their views', async () => {
    const hooks = new Hookable<KubbHooks>()
    const canonical = inputNode(['Pet', 'Store'])
    const collector = createHtmlReportCollector({ hooks, getInputNode: () => canonical })
    const cfg = config()

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: canonical.meta,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-a') })
    await hooks.callHook('kubb:generate:schema', canonical.schemas[0]!, generatorContext('plugin-a', cfg))
    await hooks.callHook('kubb:plugin:end', { plugin: plugin('plugin-a'), duration: 8, success: true, config: cfg, files: [], upsertFile: () => [] })
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-b') })
    await hooks.callHook('kubb:generate:schema', canonical.schemas[1]!, generatorContext('plugin-b', cfg))
    await hooks.callHook('kubb:plugin:end', {
      plugin: plugin('plugin-b'),
      duration: 5,
      success: false,
      error: new Error('boom'),
      config: cfg,
      files: [],
      upsertFile: () => [],
    })

    const snapshot = collector.getSnapshot()

    expect(snapshot.run?.plugins.map((entry) => ({ name: entry.name, status: entry.status, error: entry.error }))).toStrictEqual([
      { name: 'plugin-a', status: 'success', error: null },
      { name: 'plugin-b', status: 'failed', error: 'boom' },
    ])
    expect(snapshot.pluginViews['plugin-a']?.schemas.map((schema) => schema.name)).toStrictEqual(['Pet'])
    expect(snapshot.pluginViews['plugin-b']?.schemas.map((schema) => schema.name)).toStrictEqual(['Store'])
  })

  it('uses build files as the generated file set and reads only those contents from storage', async () => {
    const hooks = new Hookable<KubbHooks>()
    const storage = memoryStorage()
    await storage.writeItem('gen/pet.ts', 'export type Pet = { id: string }')
    await storage.writeItem('unrelated.ts', 'export const unrelated = true')
    const cfg = { ...config(), storage }
    const generatedFile = file('gen/pet.ts')
    const collector = createHtmlReportCollector({ hooks })

    await hooks.callHook('kubb:build:end', { config: cfg, outputDir: '/workspace/gen', files: [generatedFile] })
    await hooks.callHook('kubb:generation:end', { config: cfg, storage, status: 'success', filesCreated: 1 })

    const snapshot = collector.getSnapshot()

    expect(snapshot.files).toStrictEqual([{ id: generatedFile.id, name: 'pet', baseName: 'pet.ts', path: 'gen/pet.ts' }])
    expect(snapshot.generatedFiles).toStrictEqual({ [generatedFile.id]: 'export type Pet = { id: string }' })
  })

  it('uses generation-end diagnostics as the final source of truth without duplicating live diagnostics', async () => {
    const hooks = new Hookable<KubbHooks>()
    const cfg = config()
    const diagnostic = {
      code: Diagnostics.code.pluginWarning,
      severity: 'warning',
      message: 'Heads up',
      plugin: 'plugin-a',
    } as const
    const collector = createHtmlReportCollector({ hooks })

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: undefined,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:diagnostic', { diagnostic })
    await hooks.callHook('kubb:generation:end', { config: cfg, storage: cfg.storage, diagnostics: [diagnostic], status: 'success' })

    expect(collector.getSnapshot().run?.diagnostics).toStrictEqual([
      { code: Diagnostics.code.pluginWarning, severity: 'warning', message: 'Heads up', plugin: 'plugin-a' },
    ])
  })

  it('keeps same-message diagnostics separate when their locations differ', async () => {
    const hooks = new Hookable<KubbHooks>()
    const cfg = config()
    const diagnostics: Array<ProblemDiagnostic> = [
      {
        code: Diagnostics.code.pluginWarning,
        severity: 'warning',
        message: 'Heads up',
        plugin: 'plugin-a',
        location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      },
      {
        code: Diagnostics.code.pluginWarning,
        severity: 'warning',
        message: 'Heads up',
        plugin: 'plugin-a',
        location: { kind: 'schema', pointer: '#/components/schemas/Store' },
      },
    ]
    const collector = createHtmlReportCollector({ hooks })

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: undefined,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:generation:end', { config: cfg, storage: cfg.storage, diagnostics, status: 'success' })

    expect(collector.getSnapshot().run?.diagnostics).toStrictEqual(diagnostics)
  })

  it('records successful completion state from generation end', async () => {
    const hooks = new Hookable<KubbHooks>()
    const cfg = config()
    const collector = createHtmlReportCollector({ hooks })

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: undefined,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:generation:end', { config: cfg, storage: cfg.storage, status: 'success' })

    expect(collector.getSnapshot().run?.status).toBe('success')
  })

  it('keeps state isolated between collector instances', async () => {
    const firstHooks = new Hookable<KubbHooks>()
    const secondHooks = new Hookable<KubbHooks>()
    const first = createHtmlReportCollector({ hooks: firstHooks, getInputNode: () => inputNode(['A']) })
    const second = createHtmlReportCollector({ hooks: secondHooks, getInputNode: () => inputNode(['B']) })

    await firstHooks.callHook('kubb:build:start', {
      config: { ...config(), name: 'first' },
      adapter: { name: 'oas' },
      meta: undefined,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await secondHooks.callHook('kubb:build:start', {
      config: { ...config(), name: 'second' },
      adapter: { name: 'oas' },
      meta: undefined,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])

    expect(first.getSnapshot().run?.config).toBe('first')
    expect(first.getSnapshot().ast?.schemas.map((schema) => schema.name)).toStrictEqual(['A'])
    expect(second.getSnapshot().run?.config).toBe('second')
    expect(second.getSnapshot().ast?.schemas.map((schema) => schema.name)).toStrictEqual(['B'])
  })

  it('stops collecting after disposal', async () => {
    const hooks = new Hookable<KubbHooks>()
    const collector = createHtmlReportCollector({ hooks })
    const cfg = config()

    collector.dispose()
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-a') })
    await hooks.callHook('kubb:generation:end', { config: cfg, storage: cfg.storage, status: 'success' })

    expect(collector.getSnapshot()).toStrictEqual({ run: null, ast: null, pluginViews: {}, files: [], generatedFiles: {} })
  })
})
