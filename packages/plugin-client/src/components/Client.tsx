import { URLPath } from '@kubb/core/utils'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react'
import type { KubbNode } from '@kubb/react/types'
import type { PluginClient } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  baseURL?: string
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
  operation: Operation
}

export function Client({ name, typeSchemas, baseURL, dataReturnType, pathParamsType, operation }: Props): KubbNode {
  const contentType = operation.getContentType()
  const path = new URLPath(operation.path)
  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined,
    typeSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

  const params = FunctionParams.factory({
    pathParams: {
      mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typeSchemas.pathParams, { typed: true }),
    },
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    config: {
      type: 'Partial<RequestConfig>',
      default: '{}',
    },
  })

  const clientParams = FunctionParams.factory({
    params: {
      mode: 'object',
      children: {
        method: {
          value: JSON.stringify(operation.method),
        },
        url: {
          value: path.template,
        },
        baseURL: baseURL
          ? {
              value: JSON.stringify(baseURL),
            }
          : undefined,
        params: typeSchemas.queryParams?.name ? {} : undefined,
        data: typeSchemas.request?.name
          ? {
              value: isFormData ? 'formData' : undefined,
            }
          : undefined,
        headers: headers.length
          ? {
              value: headers.length ? `{ ${headers.join(', ')}, ...config.headers }` : undefined,
            }
          : undefined,
        config: {
          mode: 'inlineSpread',
        },
      },
    },
  })

  const formData = isFormData
    ? `
   const formData = new FormData()
   if(data) {
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
        formData.append(key, value);
      }
    })
   }
  `
    : ''

  const source = `
${formData}
const res = await client<${[typeSchemas.response.name, typeSchemas.request?.name].filter(Boolean).join(', ')}>(${clientParams.toCall()})

return ${dataReturnType === 'data' ? 'res.data' : 'res'}
  `
  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        async
        export
        params={params.toConstructor()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {source}
      </Function>
    </File.Source>
  )
}
