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
import { QueryKey, SuspenseInfiniteQuery, SuspenseInfiniteQueryOptions } from '../components'
import type { PluginReactQuery } from '../types'

export const suspenseInfiniteQueryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'react-suspense-infinite-query',
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
    const isSuspense = !!options.suspense
    const infiniteOptions = options.infinite && typeof options.infinite === 'object' ? options.infinite : undefined

    const importPath = options.query ? options.query.importPath : '@tanstack/react-query'

    const query = {
      name: getName(operation, { type: 'function', prefix: 'use', suffix: 'suspenseInfinite' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'use', suffix: 'suspenseInfinite' }),
    }

    const hasClientPlugin = !!pluginManager.getPluginByKey([pluginClientName])
    // Class-based clients are not compatible with query hooks, so we generate inline clients
    const shouldUseClientPlugin = hasClientPlugin && options.client.clientType !== 'class'
    const client = {
      name: shouldUseClientPlugin
        ? getName(operation, {
            type: 'function',
            pluginKey: [pluginClientName],
          })
        : getName(operation, {
            type: 'function',
            suffix: 'suspenseInfinite',
          }),
      file: getFile(operation, { pluginKey: [pluginClientName] }),
    }

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'SuspenseInfiniteQueryOptions' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'SuspenseInfiniteQueryKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'SuspenseInfiniteQueryKey' }),
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

    if (!isQuery || isMutation || !isSuspense || !infiniteOptions) {
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

        {shouldUseClientPlugin && <File.Import name={[client.name]} root={query.file.path} path={client.file.path} />}
        {!shouldUseClientPlugin && (
          <File.Import name={['buildFormData']} root={query.file.path} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />
        )}
        {options.customOptions && <File.Import name={[options.customOptions.name]} path={options.customOptions.importPath} />}
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
        {!shouldUseClientPlugin && (
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
            <SuspenseInfiniteQueryOptions
              name={queryOptions.name}
              clientName={client.name}
              queryKeyName={queryKey.name}
              typeSchemas={type.schemas}
              paramsCasing={options.paramsCasing}
              paramsType={options.paramsType}
              pathParamsType={options.pathParamsType}
              dataReturnType={options.client.dataReturnType || 'data'}
              cursorParam={infiniteOptions.cursorParam}
              nextParam={infiniteOptions.nextParam}
              previousParam={infiniteOptions.previousParam}
              initialPageParam={infiniteOptions.initialPageParam}
              queryParam={infiniteOptions.queryParam}
            />
          </>
        )}
        {infiniteOptions && (
          <>
            <File.Import name={['useSuspenseInfiniteQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'UseSuspenseInfiniteQueryOptions', 'UseSuspenseInfiniteQueryResult']} path={importPath} isTypeOnly />
            <SuspenseInfiniteQuery
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
              customOptions={options.customOptions}
              initialPageParam={infiniteOptions.initialPageParam}
              queryParam={infiniteOptions.queryParam}
            />
          </>
        )}
      </File>
    )
  },
})
