import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { difference } from 'remeda'
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
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = !!options.query && options.query?.methods.some((method) => operation.method === method)
    const isMutation =
      !isQuery &&
      difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some((method) => operation.method === method)

    const importPath = options.mutation ? options.mutation.importPath : 'swr'

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
      name: getName(operation, { type: 'function' }),
    }

    const mutationKey = {
      name: getName(operation, { type: 'const', suffix: 'MutationKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'MutationKey' }),
    }

    if (!isMutation) {
      return null
    }

    return (
      <File
        baseName={mutation.file.baseName}
        path={mutation.file.path}
        meta={mutation.file.meta}
        banner={getBanner({ oas, output })}
        footer={getFooter({ oas, output })}
      >
        {options.parser === 'zod' && <File.Import name={[zod.schemas.response.name]} root={mutation.file.path} path={zod.file.path} />}
        <File.Import name="useSWRMutation" path={importPath} />
        <File.Import name={['SWRMutationResponse']} path={importPath} isTypeOnly />
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['RequestConfig', 'ResponseConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
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
          paramsCasing={options.paramsCasing}
          transformer={options.mutationKey}
        />

        <Client
          name={client.name}
          isExportable={false}
          isIndexable={false}
          baseURL={options.client.baseURL}
          operation={operation}
          typeSchemas={type.schemas}
          zodSchemas={zod.schemas}
          dataReturnType={options.client.dataReturnType}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          parser={options.parser}
        />
        {options.mutation && (
          <Mutation
            name={mutation.name}
            clientName={client.name}
            typeName={mutation.typeName}
            typeSchemas={type.schemas}
            operation={operation}
            dataReturnType={options.client.dataReturnType}
            paramsType={options.paramsType}
            paramsCasing={options.paramsCasing}
            pathParamsType={options.pathParamsType}
            mutationKeyName={mutationKey.name}
            mutationKeyTypeName={mutationKey.typeName}
          />
        )}
      </File>
    )
  },
})
