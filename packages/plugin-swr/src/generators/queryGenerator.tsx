import path from 'node:path'
import { caseParams } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import { ClientLegacy as ClientLegacyComponent, pluginClientName } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Query, QueryKey, QueryOptions } from '../components'
import type { PluginSwr } from '../types'
import { transformName } from '../utils.ts'

export const queryGenerator = defineGenerator<PluginSwr>({
  name: 'swr-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { adapter, config, driver, resolver, root } = ctx
    const { output, query, paramsCasing, paramsType, pathParamsType, parser, client: clientOptions, group, transformers } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs?.resolver) return null
    const tsResolver = pluginTs.resolver

    // Determine if this operation is a query
    const isQuery = !!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase())

    if (!isQuery) return null

    const importPath = query ? query.importPath : 'swr'

    // Resolve names — apply transformers.name to each constructed name to match the old
    // createPlugin resolveName lifecycle (e.g. `findPetsByTagsQueryKey` → `findPetsByTagsQueryKeySWR`)
    const baseName = resolver.resolveName(node.operationId)
    const queryName = transformName(`use${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`, 'function', transformers)
    const queryOptionsName = transformName(`${baseName}QueryOptions`, 'function', transformers)
    const queryKeyName = transformName(`${baseName}QueryKey`, 'const', transformers)
    const queryKeyTypeName = transformName(`${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}QueryKey`, 'type', transformers)
    const clientName = baseName

    const meta = {
      file: resolver.resolveFile({ name: queryName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
      ),
    }

    const casedParams = caseParams(node.parameters, paramsCasing)
    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      ...pathParams.map((p) => tsResolver.resolvePathParamsName(node, p)),
      ...queryParams.map((p) => tsResolver.resolveQueryParamsName(node, p)),
      ...headerParams.map((p) => tsResolver.resolveHeaderParamsName(node, p)),
      node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined,
      tsResolver.resolveResponseName(node),
      ...node.responses.map((res) => tsResolver.resolveResponseStatusName(node, res.statusCode)),
    ].filter(Boolean)

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

    const resolvedClientName = shouldUseClientPlugin ? (clientPlugin?.resolver?.resolveName(node.operationId) ?? clientName) : clientName

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
        <File.Import name="useSWR" path={importPath} />
        {shouldUseClientPlugin && clientFile && <File.Import name={[resolvedClientName]} root={meta.file.path} path={clientFile.path} />}
        {!shouldUseClientPlugin && <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey
          name={queryKeyName}
          typeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          transformer={ctx.options.queryKey}
        />

        {!shouldUseClientPlugin && (
          <ClientLegacyComponent
            name={resolvedClientName}
            baseURL={clientOptions.baseURL}
            operation={{
              path: node.path,
              method: node.method,
              getDescription: () => node.description,
              getSummary: () => node.summary,
              isDeprecated: () => node.deprecated ?? false,
              getContentType: () => node.requestBody?.contentType ?? 'application/json',
            }}
            typeSchemas={buildLegacyTypeSchemas(node, tsResolver)}
            zodSchemas={zodResolver ? buildLegacyTypeSchemas(node, zodResolver) : undefined}
            dataReturnType={clientOptions.dataReturnType || 'data'}
            paramsCasing={clientOptions.paramsCasing || paramsCasing}
            paramsType={paramsType}
            pathParamsType={pathParamsType}
            parser={parser}
          />
        )}

        <QueryOptions
          name={queryOptionsName}
          clientName={resolvedClientName}
          node={node}
          tsResolver={tsResolver}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
        />

        {query && (
          <Query
            name={queryName}
            queryOptionsName={queryOptionsName}
            queryKeyName={queryKeyName}
            queryKeyTypeName={queryKeyTypeName}
            node={node}
            tsResolver={tsResolver}
            dataReturnType={clientOptions.dataReturnType || 'data'}
            paramsType={paramsType}
            paramsCasing={paramsCasing}
            pathParamsType={pathParamsType}
          />
        )}
      </File>
    )
  },
})

/**
 * Builds a legacy-compatible OperationSchemas object from OperationNode + resolver.
 * Used for the ClientLegacy component which still expects the old format.
 */
// biome-ignore lint/suspicious/noExplicitAny: bridge between v5 resolver types and legacy OperationSchemas format
function buildLegacyTypeSchemas(node: import('@kubb/ast/types').OperationNode, resolver: any) {
  const pathParams = node.parameters.filter((p) => p.in === 'path')
  const queryParams = node.parameters.filter((p) => p.in === 'query')
  const headerParams = node.parameters.filter((p) => p.in === 'header')

  const buildSchemaProps = (params: typeof pathParams) => {
    const properties: Record<string, { type: string }> = {}
    const required: string[] = []
    for (const p of params) {
      properties[p.name] = { type: p.schema?.primitive ?? 'unknown' }
      if (p.required) required.push(p.name)
    }
    return { properties, required }
  }

  return {
    response: { name: resolver.resolveResponseName(node) },
    request: node.requestBody?.schema
      ? {
          name: resolver.resolveDataName(node),
          schema: { required: node.requestBody.required ? ['body'] : [] },
        }
      : undefined,
    pathParams:
      pathParams.length > 0 && resolver.resolvePathParamsName
        ? {
            name: resolver.resolvePathParamsName(node, pathParams[0]!),
            schema: buildSchemaProps(pathParams),
          }
        : undefined,
    queryParams:
      queryParams.length > 0 && resolver.resolveQueryParamsName
        ? {
            name: resolver.resolveQueryParamsName(node, queryParams[0]!),
            schema: buildSchemaProps(queryParams),
          }
        : undefined,
    headerParams:
      headerParams.length > 0 && resolver.resolveHeaderParamsName
        ? {
            name: resolver.resolveHeaderParamsName(node, headerParams[0]!),
            schema: buildSchemaProps(headerParams),
          }
        : undefined,
    errors: node.responses
      .filter((r) => {
        const code = Number.parseInt(r.statusCode, 10)
        return code >= 400 || r.statusCode === 'default'
      })
      .map((r) => ({ name: resolver.resolveResponseStatusName(node, r.statusCode) })),
    statusCodes: node.responses.map((r) => ({ name: resolver.resolveResponseStatusName(node, r.statusCode) })),
  }
}
