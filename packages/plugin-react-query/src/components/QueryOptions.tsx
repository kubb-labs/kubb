import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getASTParams } from '@kubb/plugin-oas/utils'
import { Function, useApp } from '@kubb/react'

import { isRequired } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types.ts'
import { pluginTsName } from '@kubb/plugin-ts'

type Props = {
  name: string
  typeName: string
  options: PluginReactQuery['resolvedOptions']
}

export function QueryOptions({ name, typeName, options }: Props): ReactNode {
  const {
    plugin: {
      options: { parser, pathParamsType },
    },
  } = useApp<PluginReactQuery>()

  const { getSchemas } = useOperationManager()
  const operation = useOperation()

  const contentType = operation.getContentType()
  const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })

  const generics = new FunctionParams()
  const params = new FunctionParams()
  const queryKeyParams = new FunctionParams()

  const clientGenerics = [`${typeName}['data']`, `${typeName}['error']`]
  const client = {
    withQueryParams: !!schemas.queryParams?.name,
    withData: !!schemas.request?.name,
    withPathParams: !!schemas.pathParams?.name,
    withHeaders: !!schemas.headerParams?.name,
    method: operation.method,
    path: new URLPath(operation.path),
    generics: clientGenerics.toString(),
    contentType,
  }

  generics.add([
    { type: 'TData', default: `${typeName}["response"]` },
    { type: 'TQueryData', default: `${typeName}["response"]` },
  ])

  params.add([
    ...(pathParamsType === 'object' ? [getASTParams(schemas.pathParams, { typed: true })] : getASTParams(schemas.pathParams, { typed: true })),
    {
      name: 'params',
      type: `${typeName}['queryParams']`,
      enabled: client.withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'headers',
      type: `${typeName}['headerParams']`,
      enabled: client.withHeaders,
      required: isRequired(schemas.headerParams?.schema),
    },
    {
      name: 'data',
      type: `${typeName}['request']`,
      enabled: client.withData,
      required: isRequired(schemas.request?.schema),
    },
    {
      name: 'options',
      type: `${typeName}['client']['parameters']`,
      default: '{}',
    },
  ])

  queryKeyParams.add([
    ...(pathParamsType === 'object' ? [getASTParams(schemas.pathParams)] : getASTParams(schemas.pathParams)),
    {
      name: 'params',
      enabled: client.withQueryParams,
      required: isRequired(schemas.queryParams?.schema),
    },
    {
      name: 'data',
      enabled: client.withData,
      required: isRequired(schemas.request?.schema),
    },
  ])

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
    client.withData && !isFormData ? 'data' : undefined,
    client.withData && isFormData ? 'data: formData' : undefined,
    headers.length ? `headers: { ${headers}, ...options.headers }` : undefined,
    '...options',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`

  let returnRes = parser === 'zod' ? `return ${parser}.parse(res.data)` : 'return res.data'

  if (options.dataReturnType === 'full') {
    returnRes = parser === 'zod' ? `return {...res, data: ${parser}.parse(res.data)}` : 'return res'
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
    <Function name={`${name}QueryOptions`} export params={params.toString()}>
      {`
   const queryKey = ${name}QueryKey(${queryKeyParams.toString()})

   return queryOptions({
     queryKey,
     queryFn: async () => {
       ${formData || ''}
       const res = await client<${client.generics}>({
        ${resolvedClientOptions}
       })

       ${returnRes}
     },
   })

   `}
    </Function>
  )
}
