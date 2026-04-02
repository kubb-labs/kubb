import { caseParams } from '@kubb/ast'
import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { FabricFile } from '@kubb/fabric-core/types'
import { Const, File, Function } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { zodGroupExpr } from '../utils.ts'
import type { ZodParam } from '../utils.ts'

type Props = {
  /**
   * Variable name for the MCP server instance (e.g. 'server').
   */
  name: string
  /**
   * Human-readable server name passed to `new McpServer({ name })`.
   */
  serverName: string
  /**
   * Semantic version string passed to `new McpServer({ version })`.
   */
  serverVersion: string
  /**
   * How to style your params.
   */
  paramsCasing?: 'camelcase'
  /**
   * Operations to register as MCP tools, each carrying its handler,
   * zod schema, and AST node metadata.
   */
  operations: Array<{
    tool: {
      name: string
      title?: string
      description: string
    }
    mcp: {
      name: string
      file: FabricFile.File
    }
    zod: {
      pathParams: Array<ZodParam>
      /**
       * Query params — either a group schema name (kubbV4) or individual schemas to compose (v5).
       */
      queryParams?: string | Array<ZodParam>
      /**
       * Header params — either a group schema name (kubbV4) or individual schemas to compose (v5).
       */
      headerParams?: string | Array<ZodParam>
      requestName?: string
      responseName?: string
    }
    node: OperationNode
  }>
}

type GetParamsProps = {
  node: OperationNode
  zod: Props['operations'][number]['zod']
  paramsCasing?: 'camelcase'
}

function zodExprFromSchemaNode(schema: SchemaNode): string {
  const baseType = schema.type

  let expr: string
  switch (baseType) {
    case 'integer':
      expr = 'z.coerce.number()'
      break
    case 'number':
      expr = 'z.number()'
      break
    case 'boolean':
      expr = 'z.boolean()'
      break
    case 'array':
      expr = 'z.array(z.unknown())'
      break
    default:
      expr = 'z.string()'
  }

  if (schema.nullable) {
    expr = `${expr}.nullable()`
  }

  return expr
}

function getParams({ node, zod, paramsCasing }: GetParamsProps) {
  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')

  const pathEntries: Array<{ key: string; value: string }> = []
  const otherEntries: Array<{ key: string; value: string }> = []

  for (const p of pathParams) {
    const zodParam = zod.pathParams.find((zp) => zp.name === p.name)
    pathEntries.push({ key: p.name, value: zodParam ? zodParam.schemaName : zodExprFromSchemaNode(p.schema) })
  }

  if (zod.requestName) {
    otherEntries.push({ key: 'data', value: zod.requestName })
  }

  if (zod.queryParams) {
    otherEntries.push({ key: 'params', value: zodGroupExpr(zod.queryParams) })
  }

  if (zod.headerParams) {
    otherEntries.push({ key: 'headers', value: zodGroupExpr(zod.headerParams) })
  }

  otherEntries.sort((a, b) => a.key.localeCompare(b.key))
  const entries = [...pathEntries, ...otherEntries]

  const hasInputSchema = entries.length > 0

  return {
    hasInputSchema,
    toInputSchema: () => (hasInputSchema ? `{ ${entries.map((e) => `${e.key}: ${e.value}`).join(', ')} }` : '{}'),
    toDestructured: () => (hasInputSchema ? `{ ${entries.map((e) => e.key).join(', ')} }` : ''),
  }
}

export function Server({ name, serverName, serverVersion, paramsCasing, operations }: Props): FabricReactNode {
  return (
    <File.Source name={name} isExportable isIndexable>
      <Const name={'server'} export>
        {`
          new McpServer({
  name: '${serverName}',
  version: '${serverVersion}',
})
          `}
      </Const>

      {operations
        .map(({ tool, mcp, zod, node }) => {
          const paramsClient = getParams({
            node,
            zod,
            paramsCasing,
          })
          const outputSchema = zod.responseName

          const config = [
            tool.title ? `title: ${JSON.stringify(tool.title)}` : null,
            `description: ${JSON.stringify(tool.description)}`,
            outputSchema ? `outputSchema: { data: ${outputSchema} }` : null,
          ]
            .filter(Boolean)
            .join(',\n  ')

          if (paramsClient.hasInputSchema) {
            return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
  inputSchema: ${paramsClient.toInputSchema()},
}, async (${paramsClient.toDestructured()}) => {
  return ${mcp.name}(${paramsClient.toDestructured()})
})
          `
          }

          return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
}, async () => {
  return ${mcp.name}(${paramsClient.toDestructured()})
})
          `
        })
        .filter(Boolean)}

      <Function name="startServer" async export>
        {`try {
    const transport = new StdioServerTransport()
    await server.connect(transport)

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }`}
      </Function>
    </File.Source>
  )
}
