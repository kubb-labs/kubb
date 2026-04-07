import { FunctionParams } from '@kubb/core'
import type { OasTypes, Operation } from '@kubb/oas'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type Props = {
  typeName: string
  operation: Operation
  name: string
  statusCode: number
}

export function Response({ name, typeName, operation, statusCode }: Props): KubbReactNode {
  const responseObject = operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject
  const contentType = Object.keys(responseObject.content || {})?.[0]

  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

  const hasResponseSchema = contentType && responseObject?.content?.[contentType]?.schema !== undefined

  const params = FunctionParams.factory({
    data: {
      type: `${typeName}`,
      optional: !hasResponseSchema,
    },
  })

  const responseName = `${name}Response${statusCode}`

  return (
    <File.Source name={responseName} isIndexable isExportable>
      <Function name={responseName} export params={params.toConstructor()}>
        {`
    return new Response(JSON.stringify(data), {
      status: ${statusCode},
      ${
        headers.length
          ? `  headers: {
        ${headers.join(', \n')}
      },`
          : ''
      }
    })`}
      </Function>
    </File.Source>
  )
}
