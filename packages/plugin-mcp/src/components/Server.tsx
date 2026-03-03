import { camelCase, isValidVarName } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { SchemaObject } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { isOptional } from '@kubb/plugin-oas/utils'
import { Const, File, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type Props = {
  name: string
  serverName: string
  serverVersion: string
  paramsCasing?: 'camelcase'
  operations: Array<{
    tool: {
      name: string
      title?: string
      description: string
    }
    mcp: {
      name: string
      file: KubbFile.File
    }
    zod: {
      name: string
      file: KubbFile.File
      schemas: OperationSchemas
    }
    type: {
      schemas: OperationSchemas
    }
  }>
}

type GetParamsProps = {
  schemas: OperationSchemas
  paramsCasing?: 'camelcase'
}

function zodExprFromOasSchema(schema: SchemaObject): string {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  const baseType = types.find((t) => t && t !== 'null')
  const isNullableType = types.includes('null')

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

  if (isNullableType) {
    expr = `${expr}.nullable()`
  }

  return expr
}

function getParams({ schemas, paramsCasing }: GetParamsProps) {
  const pathParamProperties = schemas.pathParams?.schema?.properties ?? {}
  const requiredFields = Array.isArray(schemas.pathParams?.schema?.required) ? schemas.pathParams.schema.required : []

  const pathParamEntries = Object.entries(pathParamProperties).reduce<Record<string, { value: string; optional: boolean }>>(
    (acc, [originalKey, propSchema]) => {
      const key = paramsCasing === 'camelcase' || !isValidVarName(originalKey) ? camelCase(originalKey) : originalKey
      acc[key] = {
        value: zodExprFromOasSchema(propSchema as SchemaObject),
        optional: !requiredFields.includes(originalKey),
      }
      return acc
    },
    {},
  )

  return FunctionParams.factory({
    data: {
      mode: 'object',
      children: {
        ...pathParamEntries,
        data: schemas.request?.name
          ? {
              value: schemas.request?.name,
              optional: isOptional(schemas.request?.schema),
            }
          : undefined,
        params: schemas.queryParams?.name
          ? {
              value: schemas.queryParams?.name,
              optional: isOptional(schemas.queryParams?.schema),
            }
          : undefined,
        headers: schemas.headerParams?.name
          ? {
              value: schemas.headerParams?.name,
              optional: isOptional(schemas.headerParams?.schema),
            }
          : undefined,
      },
    },
  })
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
        .map(({ tool, mcp, zod }) => {
          const paramsClient = getParams({ schemas: zod.schemas, paramsCasing })
          const outputSchema = zod.schemas.response?.name

          const config = [
            tool.title ? `title: ${JSON.stringify(tool.title)}` : null,
            `description: ${JSON.stringify(tool.description)}`,
            outputSchema ? `outputSchema: { data: ${outputSchema} }` : null,
          ]
            .filter(Boolean)
            .join(',\n  ')

          if (zod.schemas.request?.name || zod.schemas.headerParams?.name || zod.schemas.queryParams?.name || zod.schemas.pathParams?.name) {
            return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
  inputSchema: ${paramsClient.toObjectValue()},
}, async (${paramsClient.toObject()}) => {
  return ${mcp.name}(${paramsClient.toObject()})
})
          `
          }

          return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
}, async () => {
  return ${mcp.name}(${paramsClient.toObject()})
})
          `
        })
        .filter(Boolean)}

      {`
export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
`}
    </File.Source>
  )
}
