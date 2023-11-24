import { OasManager } from '@kubb/swagger'

import { format } from '../mocks/format.ts'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { PluginContext, PluginManager } from '@kubb/core'
import type { KubbPlugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

describe('OperationGenerator', () => {
  const resolvePath = () => './pets.ts'
  const resolveName: PluginContext['resolveName'] = ({ name }) => name

  it('[GET] should generate code based on a operation and optionalType `questionToken`', async () => {
    const oas = await OasManager.parseFromConfig({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger-ts/mocks/petStore.yaml' },
    })

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        plugin: {} as KubbPlugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets', 'get')

    const files = await og.get(operation, og.getSchemas(operation), options)
    const get = Array.isArray(files) ? files.at(0) : files

    expect(await format(get?.source)).toMatchSnapshot()

    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const getShowByIdFiles = await og.get(operationShowById, og.getSchemas(operationShowById), options)
    const getShowById = Array.isArray(getShowByIdFiles) ? getShowByIdFiles.at(0) : getShowByIdFiles

    expect(await format(getShowById?.source)).toMatchSnapshot()
  })

  it('[POST] should generate code based on a operation', async () => {
    const oas = await OasManager.parseFromConfig({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger-ts/mocks/petStore.yaml' },
    })

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        plugin: {} as KubbPlugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets', 'post')

    const files = await og.post(operation, og.getSchemas(operation), options)
    const post = Array.isArray(files) ? files.at(0) : files

    expect(await format(post?.source)).toMatchSnapshot()
  })
})
