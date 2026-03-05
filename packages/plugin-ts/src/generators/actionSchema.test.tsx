import path from 'node:path'
import type { Config, Plugin } from '@kubb/core'
import type { SchemaObject } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildSchema, SchemaGenerator } from '@kubb/plugin-oas'
import { getSchemas } from '@kubb/plugin-oas/utils'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, test } from 'vitest'
import { createMockedPluginManager } from '#mocks'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

describe('actionSchema tests', async () => {
  const fabric = createReactFabric()

  test('Action schema with oneOf and nested enum', async () => {
    const oas = await parse(path.resolve('/tmp/action_schema.yaml'))
    
    const options: PluginTs['resolvedOptions'] = {
      enumType: 'asConst',
      enumKeyCasing: 'none',
      enumSuffix: '',
      dateType: 'string',
      integerType: 'bigint',
      transformers: {},
      unknownType: 'any',
      optionalType: 'questionToken',
      arrayType: 'array',
      override: [],
      mapper: {},
      syntaxType: 'type',
      emptySchemaType: 'unknown',
      paramsCasing: undefined,
      output: {
        path: '.',
      },
      group: undefined,
    }
    const plugin = { options } as Plugin<PluginTs>

    const mockedPluginManager = createMockedPluginManager('Action')
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

    const { schemas } = getSchemas({ oas })
    const name = 'Action'
    const schema = schemas[name] as SchemaObject
    const tree = generator.parse({ schema, name, parentName: null })

    console.log('Tree for Action:')
    console.log(JSON.stringify(tree, null, 2))
    
    await buildSchema(
      { name, tree, value: schema },
      {
        config: { root: '.', output: { path: 'test' } } as Config,
        fabric,
        generator,
        Component: typeGenerator.Schema,
        plugin,
      },
    )

    console.log('\nFiles generated:')
    for (const file of [...fabric.context.fileManager.files.values()]) {
      console.log('File:', file.path)
      for (const source of file.sources || []) {
        console.log('  Source:', { 
          name: source.name, 
          isTypeOnly: source.isTypeOnly, 
          isIndexable: source.isIndexable, 
          value: source.value 
        })
      }
    }
  })
})
