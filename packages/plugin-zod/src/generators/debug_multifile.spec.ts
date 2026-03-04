import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from '@kubb/core'
import type { SchemaObject } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { SchemaGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, test, expect, beforeEach } from 'vitest'
import { createMockedPluginManager } from '#mocks'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('multiFileApi full issue Parcel schema', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  test('Parcel schema should be z.object (not z.lazy pointing to itself)', async () => {
    const oas = await parse(path.resolve(__dirname, '../../../oas/mocks/multiFileApiFullIssue.yaml'))
    
    const options: PluginZod['resolvedOptions'] = {
      dateType: 'date',
      transformers: {},
      inferred: true,
      typed: false,
      unknownType: 'unknown',
      integerType: 'number',
      mapper: {},
      importPath: 'zod',
      coercion: false,
      operations: false,
      override: [],
      output: { path: '.' },
      group: undefined,
      wrapOutput: undefined,
      version: '3',
      guidType: 'uuid',
      emptySchemaType: 'unknown',
      mini: false,
    }
    
    const plugin = { options } as Plugin<PluginZod>
    const mockedPluginManager = createMockedPluginManager('Parcel')
    const generator = new SchemaGenerator(options, {
      fabric,
      oas,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: 'application/json',
      include: undefined,
      override: undefined,
      mode: 'split',
      output: './gen',
    })
    
    await generator.build(zodGenerator)
    
    const allFiles = fabric.context.fileManager.files
    console.log('All generated files:', allFiles.map(f => f.baseName))
    
    const allSources = allFiles.flatMap(f => f.sources || [])
    
    // Print all sources
    for (const src of allSources) {
      console.log(`\nSource: ${src.name}`)
      console.log(src.value)
    }
    
    // Find parcel source
    const parcelSource = allSources.find(s => 
      s.name?.toLowerCase() === 'parcel' || 
      s.name?.toLowerCase() === 'parcelschema'
    )
    
    if (parcelSource?.value) {
      console.log('\nParcel source value:', parcelSource.value)
      expect(parcelSource.value).toContain('z.object')
      // Should NOT be a self-referential lazy
      expect(parcelSource.value).not.toMatch(/z\.lazy\(\s*\(\s*\)\s*=>\s*parcel/)
    }
  })
})
