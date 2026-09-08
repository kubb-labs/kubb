import * as utils from '@internals/utils'
import { ast, type InputNode } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { Diagnostics } from '../Diagnostics.ts'
import { Hookable } from '../Hookable.ts'
import { memoryStorage } from '../storages/memoryStorage.ts'
import type { Config, KubbHooks } from '../types.ts'
import { createHtmlReporter } from './htmlReporter.ts'

function config(name = 'petstore'): Config {
  return {
    name,
    root: '/workspace',
    input: './petstore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    plugins: [],
    storage: memoryStorage(),
  } as unknown as Config
}

function inputNode(name = 'Pet'): InputNode {
  return ast.factory.createInput({
    meta: { circularNames: [], enumNames: [] },
    schemas: [ast.factory.createSchema({ type: 'object', name, properties: [] })],
    operations: [],
  })
}

function plugin(name: string) {
  return { name } as KubbHooks['kubb:plugin:start'][0]['plugin']
}

function parseReport(content: string) {
  const dataElement = content.match(/<script type="application\/json" id="kubb-report-data">([\s\S]*?)<\/script>/)
  expect(dataElement).not.toBeNull()
  return JSON.parse(dataElement?.[1] ?? '')
}

describe('createHtmlReporter', () => {
  it('writes one self-contained report with escaped data after lifecycle drain', async () => {
    const hooks = new Hookable<KubbHooks>()
    const storage = memoryStorage()
    const cfg = { ...config(), storage }
    const generatedFile = ast.factory.createFile({
      path: 'gen/pet.ts',
      baseName: 'pet.ts',
      sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export const pet = true')] })],
    })
    const diagnostic = {
      code: Diagnostics.code.pluginWarning,
      severity: 'warning',
      message: '</script><script>window.bad=true</script> <>&',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      plugin: 'plugin-a',
    } as const
    await storage.writeItem('gen/pet.ts', '</script><script>file-content</script> <>&')

    const reporter = createHtmlReporter({
      hooks,
      getInputNode: inputNode,
      assets: { script: 'console.log("report")', style: 'body { color: red }' },
      now: () => 123,
    })
    let html = ''
    using _write = vi.spyOn(utils, 'write').mockImplementation(async (path, content) => {
      expect(path).toBe(`${process.cwd()}/.kubb/kubb-report-123.html`)
      html = content
      return content
    })
    hooks.hook(
      'kubb:generation:end',
      async ({ config: generationConfig, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
        await reporter.report({ config: generationConfig, diagnostics, filesCreated, status, hrStart }, { logLevel: 3 })
      },
    )
    hooks.hook('kubb:lifecycle:end', () => reporter.drain({ logLevel: 3 }))

    await hooks.callHook('kubb:build:start', {
      config: cfg,
      adapter: { name: 'oas' },
      meta: undefined,
      files: [],
      getPlugin: () => undefined,
      upsertFile: () => [],
    } as unknown as KubbHooks['kubb:build:start'][0])
    await hooks.callHook('kubb:plugin:start', { plugin: plugin('plugin-a') })
    await hooks.callHook('kubb:generate:schema', inputNode().schemas[0]!, { config: cfg, plugin: plugin('plugin-a') } as never)
    await hooks.callHook('kubb:plugin:end', { plugin: plugin('plugin-a'), duration: 4, success: true, config: cfg, files: [], upsertFile: () => [] })
    await hooks.callHook('kubb:diagnostic', { diagnostic })
    await hooks.callHook('kubb:build:end', { config: cfg, outputDir: '/workspace/gen', files: [generatedFile] })
    await hooks.callHook('kubb:generation:end', { config: cfg, storage, diagnostics: [diagnostic], status: 'success' })
    await hooks.callHook('kubb:lifecycle:end')

    expect(_write).toHaveBeenCalledOnce()
    expect(html).toContain('<div id="app"></div>')
    expect(html).toContain('<style>body { color: red }</style>')
    expect(html).toContain('<script type="application/json" id="kubb-report-data">')
    expect(html).toContain('<script type="module">console.log("report")</script>')
    expect(html).not.toContain('</script><script>window.bad=true')

    const snapshot = parseReport(html)
    expect(snapshot.ast.schemas).toHaveLength(1)
    expect(snapshot.pluginViews['plugin-a'].schemas).toHaveLength(1)
    expect(snapshot.files[0].id).toBe(generatedFile.id)
    expect(snapshot.generatedFiles[generatedFile.id]).toContain('</script>')
    expect(snapshot.run.diagnostics).toHaveLength(1)
  })

  it('retains each completed config until the lifecycle drain', async () => {
    const hooks = new Hookable<KubbHooks>()
    const storage = memoryStorage()
    let currentInput = inputNode('ConfigA')
    const writes: Array<{ path: string; content: string }> = []
    const reporter = createHtmlReporter({
      hooks,
      getInputNode: () => currentInput,
      assets: { script: 'report', style: 'body {}' },
      now: () => 1000,
    })
    using _write = vi.spyOn(utils, 'write').mockImplementation(async (path, content) => {
      writes.push({ path, content })
      return content
    })
    hooks.hook(
      'kubb:generation:end',
      async ({ config: generationConfig, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
        await reporter.report({ config: generationConfig, diagnostics, filesCreated, status, hrStart }, { logLevel: 3 })
      },
    )
    hooks.hook('kubb:lifecycle:end', () => reporter.drain({ logLevel: 3 }))

    const runConfig = async (name: string, schemaName: string, pluginName: string, filePath: `${string}.${string}`, fileContent: string) => {
      const cfg = { ...config(name), storage }
      const node = inputNode(schemaName)
      currentInput = node
      const generatedFile = ast.factory.createFile({
        path: filePath,
        baseName: filePath.split('/').at(-1) as `${string}.${string}`,
        sources: [ast.factory.createSource({ nodes: [ast.factory.createText(fileContent)] })],
      })
      await storage.writeItem(filePath, fileContent)
      await hooks.callHook('kubb:build:start', {
        config: cfg,
        adapter: { name: 'oas' },
        meta: undefined,
        files: [],
        getPlugin: () => undefined,
        upsertFile: () => [],
      } as unknown as KubbHooks['kubb:build:start'][0])
      await hooks.callHook('kubb:plugin:start', { plugin: plugin(pluginName) })
      await hooks.callHook('kubb:generate:schema', node.schemas[0]!, { config: cfg, plugin: plugin(pluginName) } as never)
      await hooks.callHook('kubb:plugin:end', { plugin: plugin(pluginName), duration: 4, success: true, config: cfg, files: [], upsertFile: () => [] })
      await hooks.callHook('kubb:build:end', { config: cfg, outputDir: '/workspace/gen', files: [generatedFile] })
      await hooks.callHook('kubb:generation:end', { config: cfg, storage, diagnostics: [], status: 'success' })
    }

    await runConfig('config-a', 'SchemaA', 'plugin-a', 'gen/a.ts', 'const a = true')
    await runConfig('config-b', 'SchemaB', 'plugin-b', 'gen/b.ts', 'const b = true')

    expect(writes).toHaveLength(0)
    await hooks.callHook('kubb:lifecycle:end')

    expect(writes).toHaveLength(2)
    expect(writes.map(({ path }) => path)).toStrictEqual([`${process.cwd()}/.kubb/kubb-report-1000.html`, `${process.cwd()}/.kubb/kubb-report-1001.html`])

    const first = parseReport(writes[0]!.content)
    const second = parseReport(writes[1]!.content)
    expect(first.run.config).toBe('config-a')
    expect(first.ast.schemas.map((schema: { name: string }) => schema.name)).toStrictEqual(['SchemaA'])
    expect(Object.keys(first.pluginViews)).toStrictEqual(['plugin-a'])
    expect(first.files.map((file: { path: string }) => file.path)).toStrictEqual(['gen/a.ts'])
    expect(first.generatedFiles).toMatchObject({ [first.files[0].id]: 'const a = true' })
    expect(second.run.config).toBe('config-b')
    expect(second.ast.schemas.map((schema: { name: string }) => schema.name)).toStrictEqual(['SchemaB'])
    expect(Object.keys(second.pluginViews)).toStrictEqual(['plugin-b'])
    expect(second.files.map((file: { path: string }) => file.path)).toStrictEqual(['gen/b.ts'])
    expect(second.generatedFiles).toMatchObject({ [second.files[0].id]: 'const b = true' })
  })

  it('uses a distinct timestamp when reports are emitted in the same millisecond', async () => {
    const hooks = new Hookable<KubbHooks>()
    const reporter = createHtmlReporter({
      hooks,
      getInputNode: inputNode,
      assets: { script: 'report', style: 'body {}' },
      now: () => 2000,
    })
    const paths: Array<string> = []
    using _write = vi.spyOn(utils, 'write').mockImplementation(async (path, content) => {
      paths.push(path)
      return content
    })

    const result = { config: config(), diagnostics: [], filesCreated: 0, status: 'success' as const, hrStart: process.hrtime() }
    await reporter.report(result, { logLevel: 3 })
    await reporter.report(result, { logLevel: 3 })
    await reporter.drain({ logLevel: 3 })

    expect(paths).toStrictEqual([`${process.cwd()}/.kubb/kubb-report-2000.html`, `${process.cwd()}/.kubb/kubb-report-2001.html`])
  })
})
