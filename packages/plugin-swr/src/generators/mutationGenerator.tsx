import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { MutationKey } from '../components'
import { Mutation } from '../components'
import type { PluginSwr } from '../types'

export const mutationGenerator = createReactGenerator<PluginSwr>({
  name: 'swr-mutation',
  Operation({ options, operation }) {
    const {
      plugin: {
        options: { output },
      },
    } = useApp<PluginSwr>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isMutate = typeof options.query === 'boolean' ? options.mutation : !!options.mutation.methods?.some((method) => operation.method === method)

    const mutation = {
      name: getName(operation, { type: 'function', prefix: 'use' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'use' }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      //todo remove type?
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const zod = {
      file: getFile(operation, { pluginKey: [pluginZodName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
    }

    const client = {
      name: getName(operation, { type: 'function', pluginKey: [pluginClientName] }),
    }

    const mutationKey = {
      name: getName(operation, { type: 'const', suffix: 'MutationKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'MutationKey' }),
    }

    if (!isMutate) {
      return null
    }

    return (
      <File baseName={mutation.file.baseName} path={mutation.file.path} meta={mutation.file.meta} banner={output?.banner} footer={output?.footer}>
        {options.parser === 'zod' && <File.Import name={[zod.schemas.response.name]} root={mutation.file.path} path={zod.file.path} />}
        <File.Import name="useSWRMutation" path={options.mutation.importPath} />
        <File.Import name={['SWRMutationResponse']} path={options.mutation.importPath} isTypeOnly />
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['RequestConfig', 'ResponseConfig']} path={options.client.importPath} isTypeOnly />
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter(Boolean)}
          root={mutation.file.path}
          path={type.file.path}
          isTypeOnly
        />
        <MutationKey
          name={mutationKey.name}
          typeName={mutationKey.typeName}
          operation={operation}
          pathParamsType={options.pathParamsType}
          typeSchemas={type.schemas}
          keysFn={options.mutation.key}
        />
        <Client
          name={client.name}
          isExportable={false}
          isIndexable={false}
          baseURL={options.baseURL}
          operation={operation}
          typeSchemas={type.schemas}
          zodSchemas={zod.schemas}
          dataReturnType={options.client.dataReturnType}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          parser={options.parser}
        />
        <Mutation
          name={mutation.name}
          clientName={client.name}
          typeName={mutation.typeName}
          typeSchemas={type.schemas}
          operation={operation}
          dataReturnType={options.client.dataReturnType}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          mutationKeyName={mutationKey.name}
          mutationKeyTypeName={mutationKey.typeName}
        />
      </File>
    )
  },
})
