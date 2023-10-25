import { oasParser } from '@kubb/swagger'

import { format } from '../../mocks/format.ts'
import { OperationGenerator } from './OperationGenerator.ts'

import type { PluginContext, PluginManager } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'

describe('OperationGenerator', () => {
  const resolvePath = () => './pets.ts'
  const resolveName: PluginContext['resolveName'] = ({ name }) => name

  it('[GET] should generate code based on a operation and optionalType `questionToken`', async () => {
    const oas = await oasParser({ root: './', output: { path: 'test', clean: true }, input: { path: 'packages/swagger-ts/mocks/petStore.yaml' } })

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      mode: 'directory',
      dateType: 'string',
      optionalType: 'questionToken',
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        skipBy: [],
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets', 'get')

    const get = await og.get(operation, og.getSchemas(operation), options)

    expect(format(get?.source)).toMatchSnapshot()

    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const getShowById = await og.get(operationShowById, og.getSchemas(operationShowById), {} as typeof og.options)

    expect(await format(getShowById?.source)).toMatchSnapshot()
  })

  it('[POST] should generate code based on a operation', async () => {
    const oas = await oasParser({ root: './', output: { path: 'test', clean: true }, input: { path: 'packages/swagger-ts/mocks/petStore.yaml' } })

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      mode: 'directory',
      dateType: 'string',
      optionalType: 'questionToken',
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        skipBy: [],
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets', 'post')

    const post = await og.post(operation, og.getSchemas(operation), options)

    expect(await format(post?.source)).toMatchSnapshot()
  })
})
