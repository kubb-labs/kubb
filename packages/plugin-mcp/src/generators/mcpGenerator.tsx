import path from 'node:path'
import { caseParams } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { McpHandler } from '../components/McpHandler.tsx'
import type { PluginMcp } from '../types.ts'

export const mcpGenerator = defineGenerator<PluginMcp>({
  name: 'mcp',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { resolver, driver, root } = ctx
    const { output, client, paramsCasing, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs?.resolver) {
      return null
    }

    const casedParams = caseParams(node.parameters, paramsCasing)

    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      ...pathParams.map((p) => pluginTs.resolver.resolvePathParamsName(node, p)),
      ...queryParams.map((p) => pluginTs.resolver.resolveQueryParamsName(node, p)),
      ...headerParams.map((p) => pluginTs.resolver.resolveHeaderParamsName(node, p)),
      node.requestBody?.schema ? pluginTs.resolver.resolveDataName(node) : undefined,
      pluginTs.resolver.resolveResponseName(node),
      ...node.responses.filter((r) => Number(r.statusCode) >= 400).map((r) => pluginTs.resolver.resolveResponseStatusName(node, r.statusCode)),
    ].filter(Boolean)

    const meta = {
      name: resolver.resolveName(node.operationId),
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      fileTs: pluginTs.resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        {
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group,
        },
      ),
    } as const

    return (
      <File baseName={meta.file.baseName} path={meta.file.path} meta={meta.file.meta}>
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames)).sort()} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}
        <File.Import name={['CallToolResult']} path={'@modelcontextprotocol/sdk/types'} isTypeOnly />
        <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
        {client.importPath ? (
          <>
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={client.importPath} isTypeOnly />
            <File.Import name={'fetch'} path={client.importPath} />
            {client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={client.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/fetch.ts')}
              isTypeOnly
            />
            <File.Import name={['fetch']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} />
            {client.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} isTypeOnly />
            )}
          </>
        )}

        <McpHandler
          name={meta.name}
          node={node}
          resolver={pluginTs.resolver}
          baseURL={client.baseURL}
          dataReturnType={client.dataReturnType || 'data'}
          paramsCasing={paramsCasing}
        />
      </File>
    )
  },
})
