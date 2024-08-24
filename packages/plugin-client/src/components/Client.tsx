import { URLPath } from '@kubb/core/utils'

import { Function } from '@kubb/react'
import { isOptional, type Operation } from '@kubb/oas'
import type { KubbNode, Params } from '@kubb/react'
import type { PluginClient } from '../types.ts'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import type { OperationSchemas } from '@kubb/plugin-oas'

type Props = {
  /**
   * Name of the function
   */
  name: string
  options: PluginClient['resolvedOptions']
  typedSchemas: OperationSchemas
  operation: Operation
}

export function Client({ name, options, typedSchemas, operation }: Props): KubbNode {
  const contentType = operation.getContentType()
  const baseURL = options.client.importPath === '@kubb/plugin-client/client' ? options.baseURL : undefined
  const path = new URLPath(operation.path)
  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined,
    typedSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

  const params: Params = {
    pathParams: {
      mode: options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
      children: getPathParams(typedSchemas.pathParams, { typed: true }),
    },
    data: typedSchemas.request?.name
      ? {
          type: typedSchemas.request?.name,
          optional: isOptional(typedSchemas.request?.schema),
        }
      : undefined,
    params: typedSchemas.queryParams?.name
      ? {
          type: typedSchemas.queryParams?.name,
          optional: isOptional(typedSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typedSchemas.headerParams?.name
      ? {
          type: typedSchemas.headerParams?.name,
          optional: isOptional(typedSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: 'Partial<Parameters<typeof client>[0]>',
      default: '{}',
    },
  }

  const clientParams: Params = {
    data: {
      mode: 'object',
      children: {
        method: {
          type: 'string',
          value: JSON.stringify(operation.method),
        },
        url: {
          type: 'string',
          value: path.template,
        },
        baseURL: baseURL
          ? {
              type: 'string',
              value: JSON.stringify(baseURL),
            }
          : undefined,
        params: typedSchemas.queryParams?.name
          ? {
              type: 'any',
            }
          : undefined,
        data: typedSchemas.request?.name
          ? {
              type: 'any',
              value: isFormData ? 'formData' : undefined,
            }
          : undefined,
        headers: headers.length
          ? {
              type: 'any',
              value: headers.length ? `{ ${headers.join(', ')}, ...options.headers }` : undefined,
            }
          : undefined,
        options: {
          type: 'any',
          mode: 'inlineSpread',
        },
      },
    },
  }

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
    : undefined

  return (
    <Function
      name={name}
      async
      export
      returnType={options.dataReturnType === 'data' ? `ResponseConfig<${typedSchemas.response.name}>["data"]` : `ResponseConfig<${typedSchemas.response.name}>`}
      params={params}
      JSDoc={{
        comments: getComments(operation),
      }}
    >
      {formData || ''}
      <Function.Call
        name="res"
        to={<Function name="client" async generics={[typedSchemas.response.name, typedSchemas.request?.name].filter(Boolean)} params={clientParams} />}
      />
      <Function.Return>{options.dataReturnType === 'data' ? 'res.data' : 'res'}</Function.Return>
    </Function>
  )
}
