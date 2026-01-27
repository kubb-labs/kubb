import { URLPath } from '@kubb/core/utils'

import { getDefaultValue, isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getComments, getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
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
  isConfigurable?: boolean
  returnType?: string

  baseURL: string | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  typeSchemas: OperationSchemas
  zodSchemas: OperationSchemas | undefined
  operation: Operation
  children?: FabricReactNode
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
  isConfigurable: boolean
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas, isConfigurable }: GetParamsProps) {
  if (paramsType === 'object') {
    const pathParams = getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing })

    const children = {
      ...pathParams,
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
    }

    // Check if all children are optional or undefined
    const allChildrenAreOptional = Object.values(children).every((child) => !child || child.optional)

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children,
        default: allChildrenAreOptional ? '{}' : undefined,
      },
      config: isConfigurable
        ? {
            type: typeSchemas.request?.name
              ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
              : 'Partial<RequestConfig> & { client?: typeof fetch }',
            default: '{}',
          }
        : undefined,
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, { typed: true, casing: paramsCasing }),
          default: getDefaultValue(typeSchemas.pathParams?.schema),
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
    config: isConfigurable
      ? {
          type: typeSchemas.request?.name
            ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: typeof fetch }`
            : 'Partial<RequestConfig> & { client?: typeof fetch }',
          default: '{}',
        }
      : undefined,
  })
}

export function Client({
  name,
  isExportable = true,
  isIndexable = true,
  returnType,
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
  children,
  isConfigurable = true,
}: Props): FabricReactNode {
  const path = new URLPath(operation.path, { casing: paramsCasing })
  const contentType = operation.getContentType()
  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    typeSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const generics = [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)
  const params = getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas, isConfigurable })
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
          value: urlName ? `${urlName}(${urlParams.toCall()}).url.toString()` : path.template,
        },
        baseURL:
          baseURL && !urlName
            ? {
                value: `\`${baseURL}\``,
              }
            : undefined,
        params: typeSchemas.queryParams?.name ? {} : undefined,
        data: typeSchemas.request?.name
          ? {
              value: isFormData ? 'formData as FormData' : 'requestData',
            }
          : undefined,
        requestConfig: isConfigurable
          ? {
              mode: 'inlineSpread',
            }
          : undefined,
        headers: headers.length
          ? {
              value: isConfigurable ? `{ ${headers.join(', ')}, ...requestConfig.headers }` : `{ ${headers.join(', ')} }`,
            }
          : undefined,
      },
    },
  })

  const childrenElement = children ? (
    children
  ) : (
    <>
      {dataReturnType === 'full' && parser === 'zod' && zodSchemas && `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}`}
      {dataReturnType === 'data' && parser === 'zod' && zodSchemas && `return ${zodSchemas.response.name}.parse(res.data)`}
      {dataReturnType === 'full' && parser === 'client' && 'return res'}
      {dataReturnType === 'data' && parser === 'client' && 'return res.data'}
    </>
  )

  return (
    <>
      <br />

      <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
        <Function
          name={name}
          async
          export={isExportable}
          params={params.toConstructor()}
          JSDoc={{
            comments: getComments(operation),
          }}
          returnType={returnType}
        >
          {isConfigurable ? 'const { client: request = fetch, ...requestConfig } = config' : ''}
          <br />
          <br />
          {parser === 'zod' && zodSchemas?.request?.name
            ? `const requestData = ${zodSchemas.request.name}.parse(data)`
            : typeSchemas?.request?.name && 'const requestData = data'}
          <br />
          {isFormData && typeSchemas?.request?.name && 'const formData = buildFormData(requestData)'}
          <br />
          {isConfigurable
            ? `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`
            : `const res = await fetch<${generics.join(', ')}>(${clientParams.toCall()})`}
          <br />
          {childrenElement}
        </Function>
      </File.Source>
    </>
  )
}

Client.getParams = getParams
