import { URLPath } from '@kubb/core/utils'
import { File, Function, useApp } from '@kubb/react'
import { pluginTsName } from '@kubb/plugin-ts'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'

import { isOptional } from '@kubb/oas'
import type { HttpMethod } from '@kubb/oas'
import type { KubbNode, Params } from '@kubb/react'
import type { FileMeta, PluginClient } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'

type ClientProps = {
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

export function Client({ name, generics, returnType, params, JSDoc, client }: ClientProps): KubbNode {
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
// TOOD move to ts plugin
const typeParser = createParser({
  name: 'types',
  pluginName: pluginTsName,
})

export const clientParser = createParser<PluginClient>({
  name: 'client',
  pluginName: 'plugin-client',
  templates: {
    Operation({ operation, options, getName, getFile, getSchemas }) {
      const contentType = operation.getContentType()
      const name = getName({ type: 'function' })
      const schemas = getSchemas({ parser: typeParser })
      const file = getFile()
      const fileType = getFile({ parser: typeParser })

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta}>
          <File.Import name={'client'} path={options.client.importPath} />
          <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />
          <File.Import
            extName={options.extName}
            name={[schemas.request?.name, schemas.response.name, schemas.pathParams?.name, schemas.queryParams?.name, schemas.headerParams?.name].filter(
              Boolean,
            )}
            root={file.path}
            path={fileType.path}
            isTypeOnly
          />
          <File.Source>
            <Client
              name={name}
              params={{
                pathParams: {
                  mode: options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
                  children: getPathParams(schemas.pathParams, { typed: true }),
                },
                data: schemas.request?.name
                  ? {
                      type: schemas.request?.name,
                      optional: isOptional(schemas.request?.schema),
                    }
                  : undefined,
                params: schemas.queryParams?.name
                  ? {
                      type: schemas.queryParams?.name,
                      optional: isOptional(schemas.queryParams?.schema),
                    }
                  : undefined,
                headers: schemas.headerParams?.name
                  ? {
                      type: schemas.headerParams?.name,
                      optional: isOptional(schemas.headerParams?.schema),
                    }
                  : undefined,
                options: {
                  type: 'Partial<Parameters<typeof client>[0]>',
                  default: '{}',
                },
              }}
              returnType={options.dataReturnType === 'data' ? `ResponseConfig<${schemas.response.name}>["data"]` : `ResponseConfig<${schemas.response.name}>`}
              JSDoc={{
                comments: getComments(operation),
              }}
              client={{
                // only set baseURL from serverIndex(swagger) when no custom client(default) is used
                baseURL: options.client.importPath === '@kubb/plugin-client/client' ? options.baseURL : undefined,
                generics: [schemas.response.name, schemas.request?.name].filter(Boolean),
                dataReturnType: options.dataReturnType,
                withQueryParams: !!schemas.queryParams?.name,
                withData: !!schemas.request?.name,
                withHeaders: !!schemas.headerParams?.name,
                method: operation.method,
                path: new URLPath(operation.path),
                contentType,
              }}
            />
          </File.Source>
        </File>
      )
    },
  },
})
