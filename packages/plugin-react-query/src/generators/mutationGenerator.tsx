import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { difference } from 'remeda'
import { Mutation, MutationKey } from '../components'
import { MutationOptions } from '../components/MutationOptions.tsx'
import type { PluginReactQuery } from '../types'

export const mutationGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-query',
  Operation({ options, operation }) {
    const {
      options: { output },
    } = usePlugin<PluginReactQuery>()
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = !!options.query && options.query?.methods.some((method) => operation.method === method)
    const isMutation =
      !isQuery &&
      difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some((method) => operation.method === method)

    const importPath = options.mutation ? options.mutation.importPath : '@tanstack/react-query'

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

    const hasClientPlugin = !!pluginManager.getPluginByKey([pluginClientName])
    const client = {
      name: hasClientPlugin
        ? getName(operation, {
            type: 'function',
            pluginKey: [pluginClientName],
          })
        : getName(operation, {
            type: 'function',
          }),
      file: getFile(operation, { pluginKey: [pluginClientName] }),
    }

    const mutationOptions = {
      name: getName(operation, { type: 'function', suffix: 'MutationOptions' }),
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
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        {options.parser === 'zod' && (
          <File.Import name={[zod.schemas.response.name, zod.schemas.request?.name].filter(Boolean)} root={mutation.file.path} path={zod.file.path} />
        )}
        <File.Import name={'fetch'} path={options.client.importPath} />
        {!!hasClientPlugin && <File.Import name={[client.name]} root={mutation.file.path} path={client.file.path} />}
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

        {!hasClientPlugin && (
          <Client
            name={client.name}
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
        )}
        <File.Import name={['mutationOptions']} path={importPath} />

        <MutationOptions
          name={mutationOptions.name}
          clientName={client.name}
          mutationKeyName={mutationKey.name}
          typeSchemas={type.schemas}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          dataReturnType={options.client.dataReturnType}
        />
        {options.mutation && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['UseMutationOptions', 'UseMutationResult', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutation.name}
              mutationOptionsName={mutationOptions.name}
              typeName={mutation.typeName}
              typeSchemas={type.schemas}
              operation={operation}
              dataReturnType={options.client.dataReturnType}
              paramsCasing={options.paramsCasing}
              pathParamsType={options.pathParamsType}
              mutationKeyName={mutationKey.name}
            />
          </>
        )}
      </File>
    )
  },
})
