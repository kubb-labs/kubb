import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams } from '@kubb/plugin-oas/utils'
import { Function, useApp } from '@kubb/react'
import { pluginZodName } from '@kubb/plugin-zod'

import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'
import { pluginTsName } from '@kubb/plugin-ts'
import type { Operation } from '@kubb/oas'
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

  const generics = new FunctionParams()
  const params = new FunctionParams()

  const clientGenerics = ['TData', `${typeName}['error']`]
  const resultGenerics = ['TData', `${typeName}['error']`]

  generics.add([{ type: 'TData', default: `${typeName}['response']` }])

  params.add([
    ...getASTParams(typedSchemas.pathParams, { typed: true }),
    {
      name: 'params',
      type: `${typeName}['queryParams']`,
      enabled: !!typedSchemas.queryParams?.name,
      required: false,
    },
    {
      name: 'headers',
      type: `${typeName}['headerParams']`,
      enabled: !!typedSchemas.headerParams?.name,
      required: false,
    },
    {
      name: 'options',
      type: `${typeName}['client']['parameters']`,
      default: '{}',
    },
  ])

  const client = {
    withQueryParams: !!typedSchemas.queryParams?.name,
    withData: !!typedSchemas.request?.name,
    withPathParams: !!typedSchemas.pathParams?.name,
    withHeaders: !!typedSchemas.headerParams?.name,
    method: operation.method,
    path: new URLPath(operation.path),
    generics: clientGenerics.join(', '),
    contentType,
  }

  const isFormData = client.contentType === 'multipart/form-data'
  const headers = [
    client.contentType !== 'application/json' ? `'Content-Type': '${client.contentType}'` : undefined,
    client.withHeaders ? '...headers' : undefined,
  ]
    .filter(Boolean)
    .join(', ')

  const clientOptions = [
    `method: "${client.method}"`,
    `url: ${client.path.template}`,
    client.withQueryParams ? 'params' : undefined,
    client.withData && !isFormData ? 'data' : undefined,
    client.withData && isFormData ? 'data: formData' : undefined,
    headers.length ? `headers: { ${headers}, ...options.headers }` : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  let returnRes = options.parser === 'zod' ? `return ${zodSchemas.response.name}.parse(res.data)` : 'return res.data'

  if (options.dataReturnType === 'full') {
    returnRes = options.parser === 'zod' ? `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}` : 'return res'
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
    <Function name={name} export generics={generics.toString()} returnType={`SWRConfiguration<${resultGenerics.join(', ')}>`} params={params.toString()}>
      {`
      return {
        fetcher: async () => {
          ${formData || ''}
          const res = await client<${client.generics}>({
            ${resolvedClientOptions}
          })

         ${returnRes}
        },
      }

       `}
    </Function>
  )
}
