import { URLPath } from '@kubb/core/utils'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react'
import type { PluginClient } from '../types.ts'
import { Url } from './Url.tsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  urlName?: string
  isExportable?: boolean
  isIndexable?: boolean

  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  typeSchemas: OperationSchemas
  zodSchemas: OperationSchemas | undefined
  operation: Operation
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: GetParamsProps) {
  if (paramsType === 'object') {
    return FunctionParams.factory({
      data: {
        mode: 'object',
        children: {
          ...getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
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
        },
      },
      config: {
        type: typeSchemas.request?.name
          ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof client }`
          : 'Partial<RequestConfig> & { client?: typeof client }',
        default: '{}',
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          optional: isOptional(typeSchemas.pathParams?.schema),
        }
      : undefined,
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
      type: typeSchemas.request?.name
        ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof client }`
        : 'Partial<RequestConfig> & { client?: typeof client }',
      default: '{}',
    },
  })
}

export function Client({
  name,
  isExportable = true,
  isIndexable = true,
  typeSchemas,
  baseURL,
  dataReturnType,
  parser,
  zodSchemas,
  paramsType,
  paramsCasing,
  pathParamsType,
  operation,
  urlName,
}: Props) {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const contentType = operation.getContentType()
  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined,
    typeSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const generics = [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas })
  const urlParams = Url.getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
  })
  const clientParams = FunctionParams.factory({
    config: {
      mode: 'object',
      children: {
        method: {
          value: JSON.stringify(operation.method.toUpperCase()),
        },
        url: {
          value: urlName ? `${urlName}(${urlParams.toCall()}).toString()` : path.template,
        },
        baseURL:
          baseURL && !urlName
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
              value: headers.length ? `{ ${headers.join(', ')}, ...requestConfig.headers }` : undefined,
            }
          : undefined,
        requestConfig: {
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
      const value = data[key as keyof typeof data];
      if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
        formData.append(key, value);
      }
    })
   }
  `
    : ''

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function
        name={name}
        async
        export={isExportable}
        params={params.toConstructor()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {'const { client: request = client, ...requestConfig } = config'}
        <br />
        <br />
        {formData}
        {`const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`}
        <br />
        {dataReturnType === 'full' && parser === 'zod' && zodSchemas && `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}`}
        {dataReturnType === 'data' && parser === 'zod' && zodSchemas && `return ${zodSchemas.response.name}.parse(res.data)`}
        {dataReturnType === 'full' && parser === 'client' && 'return res'}
        {dataReturnType === 'data' && parser === 'client' && 'return res.data'}
      </Function>
    </File.Source>
  )
}

Client.getParams = getParams
