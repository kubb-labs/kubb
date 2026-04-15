import path from 'node:path'
import { defineGenerator } from '@kubb/core'
import { ClientLegacy as Client, pluginClientName } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
import type { PluginReactQuery } from '../types'
import { buildLegacyOperation, buildLegacyTypeSchemas, resolveImportedTypeNames, transformName } from '../utils.ts'

export const infiniteQueryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-infinite-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { adapter, config, driver, resolver, root } = ctx
    const { output, query, mutation, paramsCasing, paramsType, pathParamsType, parser, client: clientOptions, group, transformers, customOptions, infinite } =
      ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs?.resolver) return null
    const tsResolver = pluginTs.resolver

    const isQuery = typeof query === 'boolean' ? true : !!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase())
    const isMutation = difference(mutation ? mutation.methods : [], query ? query.methods : []).some(
      (method) => node.method.toLowerCase() === method.toLowerCase(),
    )
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : undefined

    if (!isQuery || isMutation || !infiniteOptions) {
      return null
    }

    const importPath = query ? query.importPath : '@tanstack/react-query'

    const baseName = resolver.resolveName(node.operationId)
    const queryHookName = transformName(`use${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}Infinite`, 'function', transformers)
    const queryOptionsName = transformName(`${baseName}InfiniteQueryOptions`, 'function', transformers)
    const queryKeyName = transformName(`${baseName}InfiniteQueryKey`, 'const', transformers)
    const queryKeyTypeName = transformName(`${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}InfiniteQueryKey`, 'type', transformers)
    const clientName = baseName

    const meta = {
      file: resolver.resolveFile({ name: queryHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
      ),
    }

    const importedTypeNames = resolveImportedTypeNames(node, tsResolver)

    const pluginZodRaw = parser === 'zod' ? driver.getPlugin(pluginZodName) : undefined
    const pluginZod = pluginZodRaw?.name === pluginZodName ? pluginZodRaw : undefined
    const zodResolver = pluginZod?.resolver
    const fileZod = zodResolver
      ? zodResolver.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output: pluginZod?.options?.output ?? output, group: pluginZod?.options?.group },
        )
      : undefined
    const zodSchemaNames =
      zodResolver && parser === 'zod'
        ? [zodResolver.resolveResponseName?.(node), node.requestBody?.schema ? zodResolver.resolveDataName?.(node) : undefined].filter(Boolean)
        : []

    const clientPlugin = driver.getPlugin(pluginClientName)
    const hasClientPlugin = clientPlugin?.name === pluginClientName
    const shouldUseClientPlugin = hasClientPlugin && clientOptions.clientType !== 'class'

    const clientFile = shouldUseClientPlugin
      ? clientPlugin?.resolver?.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          {
            root,
            output: clientPlugin?.options?.output ?? output,
            group: clientPlugin?.options?.group,
          },
        )
      : undefined

    const resolvedClientName = shouldUseClientPlugin
      ? (clientPlugin?.resolver?.resolveName(node.operationId) ?? clientName)
      : transformName(`${baseName}Infinite`, 'function', transformers)

    const operation = buildLegacyOperation(node)
    const typeSchemas = buildLegacyTypeSchemas(node, tsResolver)
    const zodSchemas = zodResolver ? buildLegacyTypeSchemas(node, zodResolver) : undefined

    const normalizeKey = (key?: string | null) => (key ?? '').replace(/\?$/, '')
    const queryParam = infiniteOptions.queryParam
    const cursorParam = infiniteOptions.cursorParam
    const queryParamKeys = typeSchemas.queryParams?.keys ?? []
    const responseKeys = [...(typeSchemas.responses?.flatMap((item) => item.keys ?? []) ?? []), ...(typeSchemas.response?.keys ?? [])]

    const hasQueryParam = queryParam ? queryParamKeys.some((key) => normalizeKey(key) === queryParam) : false
    const hasCursorParam = cursorParam ? responseKeys.some((key) => normalizeKey(key) === cursorParam) : true

    if (!hasQueryParam || !hasCursorParam) {
      return null
    }

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {parser === 'zod' && fileZod && zodSchemaNames.length > 0 && (
          <File.Import name={zodSchemaNames as string[]} root={meta.file.path} path={fileZod.path} />
        )}
        {clientOptions.importPath ? (
          <>
            {!shouldUseClientPlugin && <File.Import name={'fetch'} path={clientOptions.importPath} />}
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={clientOptions.importPath} isTypeOnly />
            {clientOptions.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={clientOptions.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            {!shouldUseClientPlugin && <File.Import name={['fetch']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} />}
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/fetch.ts')}
              isTypeOnly
            />
            {clientOptions.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} isTypeOnly />
            )}
          </>
        )}

        {shouldUseClientPlugin && clientFile && <File.Import name={[resolvedClientName]} root={meta.file.path} path={clientFile.path} />}
        {!shouldUseClientPlugin && <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}
        <QueryKey
          name={queryKeyName}
          typeName={queryKeyTypeName}
          operation={operation}
          paramsCasing={paramsCasing}
          pathParamsType={pathParamsType}
          typeSchemas={typeSchemas}
          transformer={ctx.options.queryKey}
        />
        {!shouldUseClientPlugin && (
          <Client
            name={resolvedClientName}
            baseURL={clientOptions.baseURL}
            operation={operation}
            typeSchemas={typeSchemas}
            zodSchemas={zodSchemas}
            dataReturnType={clientOptions.dataReturnType || 'data'}
            paramsCasing={clientOptions.paramsCasing || paramsCasing}
            paramsType={paramsType}
            pathParamsType={pathParamsType}
            parser={parser}
          />
        )}
        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {infiniteOptions && (
          <>
            <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
            <File.Import name={['infiniteQueryOptions']} path={importPath} />
            <InfiniteQueryOptions
              name={queryOptionsName}
              clientName={resolvedClientName}
              queryKeyName={queryKeyName}
              typeSchemas={typeSchemas}
              paramsCasing={paramsCasing}
              paramsType={paramsType}
              pathParamsType={pathParamsType}
              dataReturnType={clientOptions.dataReturnType || 'data'}
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
            <File.Import name={['useInfiniteQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'InfiniteQueryObserverOptions', 'UseInfiniteQueryResult']} path={importPath} isTypeOnly />
            <InfiniteQuery
              name={queryHookName}
              queryOptionsName={queryOptionsName}
              typeSchemas={typeSchemas}
              paramsCasing={paramsCasing}
              paramsType={paramsType}
              pathParamsType={pathParamsType}
              operation={operation}
              dataReturnType={clientOptions.dataReturnType || 'data'}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              initialPageParam={infiniteOptions.initialPageParam}
              queryParam={infiniteOptions.queryParam}
              customOptions={customOptions}
            />
          </>
        )}
      </File>
    )
  },
})
