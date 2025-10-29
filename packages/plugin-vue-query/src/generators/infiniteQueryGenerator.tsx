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
import type { PluginVueQuery } from '../types'

export const infiniteQueryGenerator = createReactGenerator<PluginVueQuery>({
  name: 'vue-infinite-query',
  Operation({ operation, generator, plugin }) {
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
    const isInfinite = isQuery && !!options.infinite
    const importPath = options.query ? options.query.importPath : '@tanstack/vue-query'

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

    if (!isQuery || isMutation || !isInfinite) {
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
        <File.Import name={['toValue']} path="vue" />
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />
        <File.Import name={'fetch'} path={options.client.importPath} />
        {hasClientPlugin && <File.Import name={[client.name]} root={query.file.path} path={client.file.path} />}
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
        {options.infinite && (
          <>
            <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
            <File.Import name={['infiniteQueryOptions']} path={importPath} />
            <InfiniteQueryOptions
              name={queryOptions.name}
              clientName={client.name}
              queryKeyName={queryKey.name}
              typeSchemas={type.schemas}
              paramsType={options.paramsType}
              paramsCasing={options.paramsCasing}
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
            <File.Import name={['QueryKey', 'QueryClient', 'InfiniteQueryObserverOptions', 'UseInfiniteQueryReturnType']} path={importPath} isTypeOnly />
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
