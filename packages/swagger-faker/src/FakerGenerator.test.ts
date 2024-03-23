import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { FakerGenerator } from './FakerGenerator'

import type { Plugin } from '@kubb/core'
import type { OasTypes } from '@kubb/swagger/oas'
import type { PluginOptions } from './types'

describe('FakeGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await new OasManager().parse(schemaPath)
  const generator = new FakerGenerator({
    dateType: 'string',
    mapper: undefined,
    seed: 1,
    transformers: {},
    unknownType: 'any',
    enumType: 'asConst',
    usedEnumNames: {},
  }, {
    oas,
    pluginManager: mockedPluginManager,
    plugin: {} as Plugin<PluginOptions>,
  })

  const schemas = oas.getDefinition().components?.schemas

  test('generate x-enum-varnames types', async () => {
    const node = generator.build({ schema: schemas?.['enumVarNames.Type'] as OasTypes.SchemaObject, name: 'enumVarNames' })

    expect(node).toMatchSnapshot()
  })

  test('generate x-enumNames types', async () => {
    const node = generator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, name: 'enumNames' })

    expect(node).toMatchSnapshot()
  })
})
