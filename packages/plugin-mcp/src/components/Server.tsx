import type { KubbFile } from '@kubb/core/fs'

import { Const, File, FunctionParams } from '@kubb/react'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getPathParams, isOptional } from '@kubb/plugin-oas/utils'
import { isNullable, isReference } from '@kubb/oas'
import { camelCase } from '@kubb/core/transformers'

type Props = {
  name: string
  serverName: string
  serverVersion: string
  operations: Array<{
    tool: {
      name: string
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
}

function getParams({ schemas }: GetParamsProps) {
  const pathParams = getPathParams(schemas.pathParams, {
    typed: false,
  })

  return FunctionParams.factory({
    data: {
      mode: 'object',
      children: {
        ...Object.entries(pathParams).reduce((acc, [key, param]) => {
          if (param && schemas.pathParams?.name) {
            let suffix = '.shape'

            if (isNullable(schemas.pathParams.schema)) {
              if (isReference(schemas.pathParams)) {
                suffix = '.unwrap().schema.unwrap().shape'
              } else {
                suffix = '.unwrap().shape'
              }
            } else {
              if (isReference(schemas.pathParams)) {
                suffix = '.schema.shape'
              }
            }

            param.value = `${schemas.pathParams?.name}${suffix}['${key}']`
          }

          return {
            ...acc,
            [camelCase(key)]: param,
          }
        }, {}),
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

export function Server({ name, serverName, serverVersion, operations }: Props) {
  return (
    <>
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
            const paramsClient = getParams({ schemas: zod.schemas })

            if (zod.schemas.request?.name || zod.schemas.headerParams?.name || zod.schemas.queryParams?.name || zod.schemas.pathParams?.name) {
              return `
server.tool(${JSON.stringify(tool.name)}, ${JSON.stringify(tool.description)}, ${paramsClient.toObjectValue()}, async (${paramsClient.toObject()}) => {
  return ${mcp.name}(${paramsClient.toObject()})
})
          `
            }

            return `
server.tool(${JSON.stringify(tool.name)}, ${JSON.stringify(tool.description)}, async () => {
  return ${mcp.name}(${paramsClient.toObject()})
})
          `
          })
          .filter(Boolean)}

        {`
async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
`}
      </File.Source>
    </>
  )
}
