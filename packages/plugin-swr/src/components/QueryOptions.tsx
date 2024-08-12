import { URLPath } from '@kubb/core/utils'
import { getPathParams } from '@kubb/plugin-oas/utils'
import { Function, type Params } from '@kubb/react'

import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

import { isOptional, type Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'

type Props = {
  name: string
  typeName: string
  options: PluginSwr['options']
  typedSchemas: OperationSchemas
  zodSchemas: OperationSchemas
  operation: Operation
}

export function QueryOptions({ name, typeName, operation, typedSchemas, zodSchemas, options }: Props): ReactNode {
  const contentType = operation.getContentType()
  const path = new URLPath(operation.path)
  const generics = [`TData = ${typeName}['response'`]
  const clientGenerics = ['TData', `${typeName}['error']`]
  const resultGenerics = ['TData', `${typeName}['error']`]

  const params: Params = {
    pathParams: {
      // mode: options.pathParamsType === 'object' ? 'object' : 'inlineSpread',
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

  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined,
    typedSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

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

  const client = (
    <>
      <Function.Call name="res" to={<Function name="client" async generics={clientGenerics.join(', ')} params={clientParams} />} />
      <Function.Return>
        {options.dataReturnType === 'data'
          ? options.parser === 'zod'
            ? `{...res, data: ${zodSchemas.response.name}.parse(res.data)}`
            : 'res.data'
          : options.parser === 'zod'
            ? `${zodSchemas.response.name}.parse(res)`
            : 'res'}
      </Function.Return>
    </>
  )

  return (
    <Function name={name} export generics={generics.join(', ')} returnType={`SWRConfiguration<${resultGenerics.join(', ')}>`} params={params}>
      {`
      return {
        fetcher: async () => {
          ${formData || ''}`}
      {client}
      {`
        },
      }
      `}
    </Function>
  )
}
