import path from 'node:path'
import { caseParams, transform } from '@kubb/ast'
import { defineGenerator } from '@kubb/core'
import type { PluginZod } from '@kubb/plugin-zod'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { Server } from '../components/Server.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Legacy server generator for `compatibilityPreset: 'kubbV4'`.
 *
 * Uses grouped zod schemas for query/header params (e.g. `createPetsQueryParamsSchema`)
 * and `resolveResponseName` for the combined response schema.
 * Path params are always rendered inline (no named imports).
 */
export const serverGeneratorLegacy = defineGenerator<PluginMcp>({
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
      const queryParams = casedParams.filter((p) => p.in === 'query')
      const headerParams = casedParams.filter((p) => p.in === 'header')

      const mcpFile = resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        { root, output, group },
      )

      const zodFile = pluginZod?.resolver.resolveFile(
        { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
        {
          root,
          output: pluginZod?.options?.output ?? output,
          group: pluginZod?.options?.group,
        },
      )

      const requestName = transformedNode.requestBody?.schema ? pluginZod?.resolver.resolveDataName(transformedNode) : undefined
      const responseName = pluginZod?.resolver.resolveResponseName(transformedNode)

      const zodQueryParams = queryParams.length ? pluginZod?.resolver.resolveQueryParamsName(transformedNode, queryParams[0]!) : undefined

      const zodHeaderParams = headerParams.length ? pluginZod?.resolver.resolveHeaderParamsName(transformedNode, headerParams[0]!) : undefined

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
          pathParams: [],
          queryParams: zodQueryParams,
          headerParams: zodHeaderParams,
          requestName,
          responseName,
          file: zodFile,
        },
        node: transformedNode,
      }
    })

    const imports = operationsMapped.flatMap(({ mcp, zod }) => {
      const zodNames = [zod.queryParams, zod.headerParams, zod.requestName, zod.responseName].filter(Boolean) as string[]

      return [
        <File.Import key={mcp.name} name={[mcp.name]} root={serverFile.path} path={mcp.file.path} />,
        zod.file && zodNames.length > 0 && <File.Import key={`zod-${mcp.name}`} name={zodNames.sort()} root={serverFile.path} path={zod.file.path} />,
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
            serverVersion={(adapter.document as { openapi?: string })?.openapi ?? adapter.rootNode?.meta?.version ?? '0.0.0'}
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
