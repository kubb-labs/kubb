import { URLPath } from '@kubb/core/utils'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams, createFunctionParams } from '@kubb/react'

import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

import { type Operation, isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'

type Props = {
  name: string
  baseURL: string | undefined
  queryTypeName: string
  typeSchemas: OperationSchemas
  zodSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  parser: PluginSwr['resolvedOptions']['parser'] | undefined
}

type GetParamsProps = {
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  typeSchemas: OperationSchemas
}

function getParams({ pathParamsType, typeSchemas }: GetParamsProps) {
  return FunctionParams.factory({
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
}

export function QueryOptions({ name, queryTypeName, baseURL, operation, typeSchemas, zodSchemas, parser, dataReturnType, pathParamsType }: Props): ReactNode {
  const contentType = operation.getContentType()
  const isFormData = contentType === 'multipart/form-data'
  const generics = [`TData = ${queryTypeName}['response']`]
  const resultGenerics = ['TData', `${queryTypeName}['error']`]

  const params = getParams({ pathParamsType, typeSchemas })

  const clientParams = Client.getParams({
    pathParamsType,
    typeSchemas,
    baseURL,
    operation,
  })

  // TODO replace with import of the Client Component, not need to repeat the logic
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

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} returnType={`SWRConfiguration<${resultGenerics.join(', ')}>`} params={params.toConstructor()}>
        {`
      return {
        fetcher: async () => {
          ${formData || ''}
          const res = await client<${[typeSchemas.response.name, typeSchemas.request?.name].filter(Boolean).join(', ')}>(${clientParams.toCall()})

          ${
            dataReturnType === 'data'
              ? parser === 'zod'
                ? `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}`
                : 'return res.data'
              : parser === 'zod'
                ? `return ${zodSchemas.response.name}.parse(res)`
                : 'return res'
          }
        },
      }
      `}
      </Function>
    </File.Source>
  )
}

QueryOptions.getParams = getParams
