import type { OasTypes, Operation } from '@kubb/oas'
import { File, Function, FunctionParams } from '@kubb/react'
import type { ReactNode } from 'react'

type Props = {
  typeName: string
  operation: Operation
  name: string
  statusCode: number
}

export function Response({ name, typeName, operation, statusCode }: Props): ReactNode {
  const responseObject = operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject
  const contentType = Object.keys(responseObject.content || {})?.[0]

  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

  const params = FunctionParams.factory({
    data: {
      type: `${typeName}`,
    },
  })

  return (
    <File.Source isIndexable isExportable>
      <Function name={`${name}HandlerResponse${statusCode}`} export params={params.toConstructor()}>
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
