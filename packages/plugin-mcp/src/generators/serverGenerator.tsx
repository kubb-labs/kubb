import path from 'node:path'
import { caseParams, transform } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import type { PluginZod } from '@kubb/plugin-zod'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
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
  type: 'react',
  Operations({ nodes, adapter, options, config, driver, resolver, plugin }) {
    const { output, paramsCasing, group } = options
    const root = path.resolve(config.root, config.output.path)

    const pluginZod = driver.getPlugin<PluginZod>(pluginZodName)

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
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

      const casedParams = caseParams(transformedNode.parameters, paramsCasing)
      const pathParams = casedParams.filter((p) => p.in === 'path')
      const queryParams = casedParams.filter((p) => p.in === 'query')
      const headerParams = casedParams.filter((p) => p.in === 'header')

      const mcpFile = resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      )

      const zodFile = pluginZod.resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        {
          root,
          output: pluginZod.options?.output ?? output,
          group: pluginZod.options?.group,
        },
      )

      const requestName = transformedNode.requestBody?.schema ? pluginZod.resolver.resolveDataName(transformedNode) : undefined
      const successStatus = findSuccessStatusCode(transformedNode.responses)
      const responseName = successStatus ? pluginZod.resolver.resolveResponseStatusName(transformedNode, successStatus) : undefined

      const resolveParams = (params: typeof pathParams) =>
        params.map((p) => ({ name: p.name, schemaName: pluginZod.resolver.resolveParamName(transformedNode, p) }))

      return {
        tool: {
          name: transformedNode.operationId,
          title: transformedNode.summary || undefined,
          description: transformedNode.description || `Make a ${transformedNode.method.toUpperCase()} request to ${transformedNode.path}`,
        },
        mcp: {
          name: resolver.resolveName(transformedNode.operationId),
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
        node: transformedNode,
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
          banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
          footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
        >
          <File.Import name={['McpServer']} path={'@modelcontextprotocol/sdk/server/mcp'} />
          <File.Import name={['z']} path={'zod'} />
          <File.Import name={['StdioServerTransport']} path={'@modelcontextprotocol/sdk/server/stdio'} />

          {imports}
          <Server
            name={name}
            serverName={adapter.rootNode?.meta?.title ?? 'server'}
            serverVersion={adapter.rootNode?.meta?.version ?? '0.0.0'}
            paramsCasing={paramsCasing}
            operations={operationsMapped}
          />
        </File>

        <File baseName={jsonFile.baseName} path={jsonFile.path} meta={jsonFile.meta}>
          <File.Source name={name}>
            {`
          {
            "mcpServers": {
              "${adapter.rootNode?.meta?.title || 'server'}": {
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
