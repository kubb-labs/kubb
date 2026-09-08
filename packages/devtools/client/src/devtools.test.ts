import { describe, expect, it } from 'vitest'
import {
  connect,
  createStaticDataSource,
  fetchAst,
  fetchFiles,
  fetchPluginNames,
  fetchPluginView,
  readGeneratedFile,
  run,
  setStaticReportData,
  type StaticReportSnapshot,
} from './devtools'

function snapshot(): StaticReportSnapshot {
  return {
    run: {
      id: 1,
      config: 'petstore',
      status: 'success',
      duration: 42,
      fileCount: 1,
      schemaCount: 3,
      operationCount: 0,
      plugins: [
        { name: 'plugin-a', status: 'success', duration: 10, error: null, schemaCount: 1, operationCount: 0 },
        { name: 'plugin-b', status: 'success', duration: 20, error: null, schemaCount: 0, operationCount: 0 },
      ],
      diagnostics: [],
    },
    ast: { schemas: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], operations: [], meta: undefined },
    pluginViews: {
      'plugin-a': { schemas: [{ name: 'A' }], operations: [] },
      'plugin-b': { schemas: [{ name: 'B' }], operations: [] },
    },
    files: [{ id: 'file-1', name: 'pet', baseName: 'pet.ts', path: 'gen/pet.ts' }],
    generatedFiles: { 'file-1': 'export type Pet = {}' },
  }
}

describe('createStaticDataSource', () => {
  it('exposes the run summary and connects without a network', async () => {
    const input = snapshot()
    const source = createStaticDataSource(input)

    await expect(source.connect()).resolves.toBeUndefined()
    expect(source.run).toMatchObject({ id: 1, status: 'success', duration: 42 })

    input.run!.config = 'caller mutation'
    source.run!.plugins[0]!.name = 'ui mutation'

    expect(source.run?.config).toBe('petstore')
    expect(source.run?.plugins[0]?.name).toBe('plugin-a')
  })

  it('returns the canonical AST separately from plugin views', async () => {
    const source = createStaticDataSource(snapshot())

    expect(await source.fetchAst()).toStrictEqual({ schemas: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], operations: [], meta: undefined })
    expect(await source.fetchPluginView('plugin-a')).toStrictEqual({ schemas: [{ name: 'A' }], operations: [], meta: undefined })
  })

  it('returns plugin names, files, and generated contents from the snapshot', async () => {
    const source = createStaticDataSource(snapshot())

    await expect(source.fetchPluginNames()).resolves.toStrictEqual(['plugin-a', 'plugin-b'])
    await expect(source.fetchFiles()).resolves.toStrictEqual([{ id: 'file-1', name: 'pet', baseName: 'pet.ts', path: 'gen/pet.ts' }])
    await expect(source.readGeneratedFile('file-1')).resolves.toBe('export type Pet = {}')
  })

  it('returns null for an unknown plugin or file', async () => {
    const source = createStaticDataSource(snapshot())

    await expect(source.fetchPluginView('missing')).resolves.toBeNull()
    await expect(source.readGeneratedFile('missing')).resolves.toBeNull()
  })

  it('configures the module API consumed by the presentation components', async () => {
    setStaticReportData(snapshot())

    await expect(connect()).resolves.toBeUndefined()
    expect(run.value?.config).toBe('petstore')
    await expect(fetchAst()).resolves.toMatchObject({ schemas: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] })
    await expect(fetchPluginNames()).resolves.toStrictEqual(['plugin-a', 'plugin-b'])
    await expect(fetchPluginView('plugin-a')).resolves.toMatchObject({ schemas: [{ name: 'A' }] })
    await expect(fetchFiles()).resolves.toHaveLength(1)
    await expect(readGeneratedFile('file-1')).resolves.toBe('export type Pet = {}')
  })
})
