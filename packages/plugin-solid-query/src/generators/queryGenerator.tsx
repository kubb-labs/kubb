import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { difference } from 'remeda'
import { Query, QueryKey, QueryOptions } from '../components'
import type { PluginSolidQuery } from '../types'

export const queryGenerator = createReactGenerator<PluginSolidQuery>({
  name: 'svelte-query',
  Operation({ options, operation }) {
    const {
      plugin: {
        options: { output },
      },
      pluginManager,
    } = useApp<PluginSolidQuery>()
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)
    const isMutation = difference(['post', 'put', 'delete', 'patch'], options.query ? options.query.methods : []).some((method) => operation.method === method)
    const importPath = options.query ? options.query.importPath : '@tanstack/solid-query'

    const query = {
      name: getName(operation, { type: 'function', prefix: 'create' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'create' }),
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

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'QueryKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'QueryKey' }),
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

    if (!isQuery || isMutation) {
      return null
    }

    return (
      <File
        baseName={query.file.baseName}
        path={query.file.path}
        meta={query.file.meta}
        banner={getBanner({ oas, output })}
        footer={getFooter({ oas, output })}
      >
        {options.parser === 'zod' && <File.Import name={[zod.schemas.response.name]} root={query.file.path} path={zod.file.path} />}
        <File.Import name={'client'} path={options.client.importPath} />
        {!!hasClientPlugin && <File.Import name={[client.name]} root={query.file.path} path={client.file.path} />}
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
        {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter(Boolean)}
          root={query.file.path}
          path={type.file.path}
          isTypeOnly
        />
        <QueryKey
          name={queryKey.name}
          typeName={queryKey.typeName}
          operation={operation}
          paramsCasing={options.paramsCasing}
          pathParamsType={options.pathParamsType}
          typeSchemas={type.schemas}
          transformer={options.queryKey}
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
        <File.Import name={['queryOptions']} path={importPath} />
        <QueryOptions
          name={queryOptions.name}
          clientName={client.name}
          queryKeyName={queryKey.name}
          typeSchemas={type.schemas}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          dataReturnType={options.client.dataReturnType}
        />
        {options.query && (
          <>
            <File.Import name={['createQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'CreateBaseQueryOptions', 'CreateQueryResult']} path={importPath} isTypeOnly />
            <Query
              name={query.name}
              queryOptionsName={queryOptions.name}
              typeSchemas={type.schemas}
              paramsType={options.paramsType}
              pathParamsType={options.pathParamsType}
              operation={operation}
              paramsCasing={options.paramsCasing}
              dataReturnType={options.client.dataReturnType}
              queryKeyName={queryKey.name}
              queryKeyTypeName={queryKey.typeName}
            />
          </>
        )}
      </File>
    )
  },
})
