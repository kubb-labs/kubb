import { URLPath } from '@kubb/core/utils'
import type { OasTypes, Operation } from '@kubb/oas'
import { File, Function, FunctionParams } from '@kubb/react'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  fakerName: string
  baseURL: string | undefined
  operation: Operation
}

export function Mock({ baseURL = '', name, typeName, operation }: Props) {
  const method = operation.method
  const successStatusCodes = operation.getResponseStatusCodes().filter((code) => code.startsWith('2'))
  const statusCode = successStatusCodes.length > 0 ? Number(successStatusCodes[0]) : 200

  const responseObject = operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject
  const contentType = Object.keys(responseObject.content || {})?.[0]
  const url = new URLPath(operation.path).toURLPath().replace(/([^/]):/g, '$1\\\\:')

  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

  const hasResponseSchema = contentType && responseObject?.content?.[contentType]?.schema !== undefined

  // If no response schema, uses any type but function to avoid overriding callback
  const dataType = hasResponseSchema ? typeName : `string | number | boolean | null | object`

  const params = FunctionParams.factory({
    data: {
      type: `${dataType} | ((
        info: Parameters<Parameters<typeof http.${method}>[1]>[0],
      ) => Response | Promise<Response>)`,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()}>
        {`return http.${method}('${baseURL}${url.replace(/([^/]):/g, '$1\\\\:')}', function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: ${statusCode},
      ${
        headers.length
          ? `  headers: {
        ${headers.join(', \n')}
      },`
          : ''
      }
    })
  })`}
      </Function>
    </File.Source>
  )
}
