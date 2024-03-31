import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { SchemaObject } from '@kubb/swagger/oas'
import { fakerKeywordMapper } from './fakerParser.tsx'
import type { PluginOptions } from './types'

describe('Faker SchemaGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await new OasManager().parse(schemaPath)
  const generator = new SchemaGenerator(
    {
      dateType: 'string',
      seed: 1,
      transformers: {},
      unknownType: 'any',
      mapper: fakerKeywordMapper,
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    },
  )

  const schemas = oas.getDefinition().components?.schemas

  test('generate x-enum-varnames types', async () => {
    const node = generator.buildSource('enumVarNames', schemas?.['enumVarNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate x-enumNames types', async () => {
    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})
