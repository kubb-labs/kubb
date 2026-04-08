import path from 'node:path'
import { caseParams } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Server } from '../components/Server.tsx'
import type { PluginMcp } from '../types.ts'
import { findSuccessStatusCode } from '../utils.ts'

/**
 * Default server generator for `compatibilityPreset: 'default'` (v5).
 *
 * Uses individual zod schemas for each param (e.g. `createPetsPathUuidSchema`, `createPetsQueryOffsetSchema`)
 * and `resolveResponseStatusName` for per-status response schemas.
 * Query and header params are composed into `z.object({ ... })` from individual schemas.
 */
export const serverGenerator = defineGenerator<PluginMcp>({
  name: 'operations',
  renderer: jsxRenderer,
  operations(nodes, options) {
    const { adapter, config, resolver, plugin, driver, root } = this
    const { output, paramsCasing, group } = options

    const pluginZod = driver.getPlugin(pluginZodName)

    if (!pluginZod?.resolver) {
      return
    }

    const name = 'server'
    const serverFilePath = path.resolve(root, output.path, 'server.ts')
    const serverFile = {
      baseName: 'server.ts' as const,
      path: serverFilePath,
      meta: { pluginName: plugin.name },
    }

    const jsonFilePath = path.resolve(root, output.path, '.mcp.json')
    const jsonFile = {
      baseName: '.mcp.json' as const,
      path: jsonFilePath,
      meta: { pluginName: plugin.name },
    }

    const operationsMapped = nodes.map((node) => {
      const casedParams = caseParams(node.parameters, paramsCasing)
      const pathParams = casedParams.filter((p) => p.in === 'path')
      const queryParams = casedParams.filter((p) => p.in === 'query')
      const headerParams = casedParams.filter((p) => p.in === 'header')

      const mcpFile = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

      const zodFile = pluginZod.resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        {
          root,
          output: pluginZod.options?.output ?? output,
          group: pluginZod.options?.group,
        },
      )

      const requestName = node.requestBody?.schema ? pluginZod.resolver.resolveDataName(node) : undefined
      const successStatus = findSuccessStatusCode(node.responses)
      const responseName = successStatus ? pluginZod.resolver.resolveResponseStatusName(node, successStatus) : undefined

      const resolveParams = (params: typeof pathParams) => params.map((p) => ({ name: p.name, schemaName: pluginZod.resolver.resolveParamName(node, p) }))

      return {
        tool: {
          name: node.operationId,
          title: node.summary || undefined,
          description: node.description || `Make a ${node.method.toUpperCase()} request to ${node.path}`,
        },
        mcp: {
          name: resolver.resolveName(node.operationId),
          file: mcpFile,
        },
        zod: {
          pathParams: resolveParams(pathParams),
          queryParams: queryParams.length ? resolveParams(queryParams) : undefined,
          headerParams: headerParams.length ? resolveParams(headerParams) : undefined,
          requestName,
          responseName,
          file: zodFile,
        },
        node: node,
      }
    })

    const imports = operationsMapped.flatMap(({ mcp, zod }) => {
      const zodNames = [
        ...zod.pathParams.map((p) => p.schemaName),
        ...(zod.queryParams ?? []).map((p) => p.schemaName),
        ...(zod.headerParams ?? []).map((p) => p.schemaName),
        zod.requestName,
        zod.responseName,
      ].filter(Boolean)

      const uniqueNames = [...new Set(zodNames)].sort()

      return [
        <File.Import key={mcp.name} name={[mcp.name]} root={serverFile.path} path={mcp.file.path} />,
        uniqueNames.length > 0 && <File.Import key={`zod-${mcp.name}`} name={uniqueNames} root={serverFile.path} path={zod.file.path} />,
      ].filter(Boolean)
    })

    return (
      <>
        <File
          baseName={serverFile.baseName}
          path={serverFile.path}
          meta={serverFile.meta}
          banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
          footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
        >
          <File.Import name={['McpServer']} path={'@modelcontextprotocol/sdk/server/mcp'} />
          <File.Import name={['z']} path={'zod'} />
          <File.Import name={['StdioServerTransport']} path={'@modelcontextprotocol/sdk/server/stdio'} />

          {imports}
          <Server
            name={name}
            serverName={adapter.inputNode?.meta?.title ?? 'server'}
            serverVersion={adapter.inputNode?.meta?.version ?? '0.0.0'}
            paramsCasing={paramsCasing}
            operations={operationsMapped}
          />
        </File>

        <File baseName={jsonFile.baseName} path={jsonFile.path} meta={jsonFile.meta}>
          <File.Source name={name}>
            {`
          {
            "mcpServers": {
              "${adapter.inputNode?.meta?.title || 'server'}": {
                "type": "stdio",
                "command": "npx",
                "args": ["tsx", "${path.relative(path.dirname(jsonFile.path), serverFile.path)}"]
              }
            }
          }
          `}
          </File.Source>
        </File>
      </>
    )
  },
})
