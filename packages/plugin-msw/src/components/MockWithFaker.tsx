import { URLPath } from '@kubb/core/utils'

import type { OasTypes, Operation } from '@kubb/oas'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  fakerName: string
  baseURL: string | undefined
  operation: Operation

  pathParamsType?: string
  requestBodyType?: string
}

export function MockWithFaker({ baseURL = '', name, fakerName, typeName, operation, pathParamsType, requestBodyType }: Props): KubbNode {
  const method = operation.method
  const successStatusCodes = operation.getResponseStatusCodes().filter((code) => code.startsWith('2'))
  const statusCode = successStatusCodes.length > 0 ? Number(successStatusCodes[0]) : 200

  const responseObject = operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject
  const contentType = Object.keys(responseObject.content || {})?.[0]
  const url = new URLPath(operation.path).toURLPath().replace(/([^/]):/g, '$1\\\\:')

  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

    const resolver = `${pathParamsType || 'never'}, ${requestBodyType || 'never'}, ${typeName || 'never'}`


  const params = FunctionParams.factory({
    data: {
      type: `${typeName} | HttpResponseResolver<${resolver}>`,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()}>
        {`return http.${method}<${resolver}>('${baseURL}${url.replace(/([^/]):/g, '$1\\\\:')}', function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data || ${fakerName}(data)), {
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
