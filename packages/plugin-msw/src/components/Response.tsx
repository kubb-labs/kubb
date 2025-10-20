import type { OasTypes, Operation } from '@kubb/oas'
import { File, Function, FunctionParams } from '@kubb/react'
import type { ReactNode } from 'react'

type Props = {
  typeName: string
  operation: Operation
  name: string
}

export function Response({ name, typeName, operation }: Props): ReactNode {
  const successStatusCodes = operation.getResponseStatusCodes().filter((code) => code.startsWith('2'))
  const statusCode = successStatusCodes.length > 0 ? Number(successStatusCodes[0]) : 200

  const responseObject = operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject
  const contentType = Object.keys(responseObject.content || {})?.[0]

  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

  const params = FunctionParams.factory({
    data: {
      type: `${typeName}`,
      optional: true,
    },
  })

  return (
    <File.Source isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()}>
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
