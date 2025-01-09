import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { difference } from 'remeda'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
import type { PluginReactQuery } from '../types'

export const infiniteQueryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-infinite-query',
  Operation({ options, operation }) {
    const {
      plugin: {
        options: { output },
      },
    } = useApp<PluginReactQuery>()
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)
    const isMutation = difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some(
      (method) => operation.method === method,
    )
    const isInfinite = !!options.infinite

    const importPath = options.query ? options.query.importPath : '@tanstack/react-query'

    const query = {
      name: getName(operation, { type: 'function', prefix: 'use', suffix: 'infinite' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'use', suffix: 'infinite' }),
    }

    const client = {
      name: getName(operation, { type: 'function' }),
    }

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'InfiniteQueryOptions' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'InfiniteQueryKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'InfiniteQueryKey' }),
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

    if (!isQuery || isMutation || !isInfinite) {
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
        {options.infinite && (
          <>
            <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
            <File.Import name={['infiniteQueryOptions']} path={importPath} />
            <InfiniteQueryOptions
              name={queryOptions.name}
              clientName={client.name}
              queryKeyName={queryKey.name}
              typeSchemas={type.schemas}
              paramsCasing={options.paramsCasing}
              paramsType={options.paramsType}
              pathParamsType={options.pathParamsType}
              dataReturnType={options.client.dataReturnType}
              cursorParam={options.infinite.cursorParam}
              initialPageParam={options.infinite.initialPageParam}
              queryParam={options.infinite.queryParam}
            />
          </>
        )}
        {options.infinite && (
          <>
            <File.Import name={['useInfiniteQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'InfiniteQueryObserverOptions', 'UseInfiniteQueryResult']} path={importPath} isTypeOnly />
            <InfiniteQuery
              name={query.name}
              queryOptionsName={queryOptions.name}
              typeSchemas={type.schemas}
              paramsCasing={options.paramsCasing}
              paramsType={options.paramsType}
              pathParamsType={options.pathParamsType}
              operation={operation}
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
