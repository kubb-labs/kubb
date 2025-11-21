import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { pluginClientName } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { difference } from 'remeda'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
import type { PluginReactQuery } from '../types'

export const infiniteQueryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-infinite-query',
  Operation({ config, operation, generator, plugin }) {
    const {
      options,
      options: { output },
    } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)
    const isMutation = difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some(
      (method) => operation.method === method,
    )
    const infiniteOptions = options.infinite && typeof options.infinite === 'object' ? options.infinite : undefined

    const importPath = options.query ? options.query.importPath : '@tanstack/react-query'

    const query = {
      name: getName(operation, { type: 'function', prefix: 'use', suffix: 'infinite' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'use', suffix: 'infinite' }),
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
            suffix: 'infinite',
          }),
      file: getFile(operation, { pluginKey: [pluginClientName] }),
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

    if (!isQuery || isMutation || !infiniteOptions) {
      return null
    }

    const normalizeKey = (key?: string | null) => (key ?? '').replace(/\?$/, '')
    const queryParam = infiniteOptions.queryParam
    const cursorParam = infiniteOptions.cursorParam
    const queryParamKeys = type.schemas.queryParams?.keys ?? []
    const responseKeys = [...(type.schemas.responses?.flatMap((item) => item.keys ?? []) ?? []), ...(type.schemas.response?.keys ?? [])]

    const hasQueryParam = queryParam ? queryParamKeys.some((key) => normalizeKey(key) === queryParam) : false
    const hasCursorParam = cursorParam ? responseKeys.some((key) => normalizeKey(key) === cursorParam) : true

    if (!hasQueryParam || !hasCursorParam) {
      return null
    }

    return (
      <File
        baseName={query.file.baseName}
        path={query.file.path}
        meta={query.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        {options.parser === 'zod' && (
          <File.Import name={[zod.schemas.response.name, zod.schemas.request?.name].filter(Boolean)} root={query.file.path} path={zod.file.path} />
        )}
        {options.client.importPath ? (
          <>
            <File.Import name={'fetch'} path={options.client.importPath} />
            <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
            {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            <File.Import name={['fetch']} root={query.file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
            <File.Import
              name={['RequestConfig', 'ResponseErrorConfig']}
              root={query.file.path}
              path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')}
              isTypeOnly
            />
            {options.client.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={query.file.path} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} isTypeOnly />
            )}
          </>
        )}

        {hasClientPlugin && <File.Import name={[client.name]} root={query.file.path} path={client.file.path} />}
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
            dataReturnType={options.client.dataReturnType || 'data'}
            paramsCasing={options.paramsCasing}
            paramsType={options.paramsType}
            pathParamsType={options.pathParamsType}
            parser={options.parser}
          />
        )}
        {infiniteOptions && (
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
              dataReturnType={options.client.dataReturnType || 'data'}
              cursorParam={infiniteOptions.cursorParam}
              initialPageParam={infiniteOptions.initialPageParam}
              queryParam={infiniteOptions.queryParam}
            />
          </>
        )}
        {infiniteOptions && (
          <>
            <File.Import name={['useInfiniteQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'InfiniteQueryObserverOptions', 'UseInfiniteQueryResult']} path={importPath} isTypeOnly />
            <InfiniteQuery
              name={query.name}
              queryOptionsName={queryOptions.name}
              typeSchemas={type.schemas}
              paramsCasing={options.paramsCasing}
              paramsType={options.paramsType}
              pathParamsType={options.pathParamsType}
              operation={operation}
              dataReturnType={options.client.dataReturnType || 'data'}
              queryKeyName={queryKey.name}
              queryKeyTypeName={queryKey.typeName}
              initialPageParam={infiniteOptions.initialPageParam}
              queryParam={infiniteOptions.queryParam}
            />
          </>
        )}
      </File>
    )
  },
})
