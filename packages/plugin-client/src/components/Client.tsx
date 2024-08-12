import type { URLPath } from '@kubb/core/utils'

import { Function } from '@kubb/react'
import type { HttpMethod } from '@kubb/oas'
import type { KubbNode, Params } from '@kubb/react'
import type { PluginClient } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * Parameters/options/props that need to be used
   */
  params: Params
  /**
   * Generics that needs to be added for TypeScript
   */
  generics?: string
  /**
   * ReturnType(see async for adding Promise type)
   */
  returnType?: string
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[]
  }
  client: {
    baseURL: string | undefined
    generics: string | string[]
    method: HttpMethod
    path: URLPath
    dataReturnType: PluginClient['options']['dataReturnType']
    withQueryParams: boolean
    withData: boolean
    withHeaders: boolean
    contentType: string
  }
}

export function Client({ name, generics, returnType, params, JSDoc, client }: Props): KubbNode {
  const isFormData = client.contentType === 'multipart/form-data'
  const headers = [
    client.contentType !== 'application/json' ? `'Content-Type': '${client.contentType}'` : undefined,
    client.withHeaders ? '...headers' : undefined,
  ]
    .filter(Boolean)
    .join(', ')
  const clientParams: Params = {
    data: {
      mode: 'object',
      children: {
        method: {
          type: 'string',
          value: JSON.stringify(client.method),
        },
        url: {
          type: 'string',
          value: client.path.template,
        },
        baseURL: client.baseURL
          ? {
              type: 'string',
              value: JSON.stringify(client.baseURL),
            }
          : undefined,
        params: client.withQueryParams
          ? {
              type: 'any',
            }
          : undefined,
        data: client.withData
          ? {
              type: 'any',
              value: isFormData ? 'formData' : undefined,
            }
          : undefined,
        headers: headers.length
          ? {
              type: 'any',
              value: headers.length ? `{ ${headers}, ...options.headers }` : undefined,
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
    <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {formData || ''}
      <Function.Call name="res" to={<Function name="client" async generics={client.generics} params={clientParams} />} />
      <Function.Return>{client.dataReturnType === 'data' ? 'res.data' : 'res'}</Function.Return>
    </Function>
  )
}
