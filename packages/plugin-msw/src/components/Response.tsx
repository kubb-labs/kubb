import type { OasTypes, Operation } from '@kubb/oas'
import { File, Function, FunctionParams } from '@kubb/react'

type Props = {
  typeName: string
  operation: Operation
  name: string
  statusCode: number
}

export function Response({ name, typeName, operation, statusCode }: Props) {
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
