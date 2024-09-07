import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function, createFunctionParams } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import type { ReactNode } from 'react'
import type { PluginReactQuery } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  typedSchemas: OperationSchemas
  zodSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginReactQuery['resolvedOptions']['query']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  parser?: PluginReactQuery['resolvedOptions']['parser']
}

export function Mutation({ name, typeName, pathParamsType, dataReturnType, zodSchemas, parser, typedSchemas, operation }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const contentType = operation.getContentType()
  const queryParams = new FunctionParams()
  const params = new FunctionParams()
  const queryKeyParams = new FunctionParams()
  const generics = new FunctionParams()

  queryParams.add([
    ...getASTParams(typedSchemas.pathParams, { typed: false }),
    {
      name: 'params',
      enabled: !!typedSchemas.queryParams?.name,
      required: !isOptional(typedSchemas.queryParams?.schema),
    },
    {
      name: 'headers',
      enabled: !!typedSchemas.headerParams?.name,
      required: !isOptional(typedSchemas.headerParams?.schema),
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  generics.add([
    {
      type: 'TData',
      default: `${typeName}["response"]`,
    },
    { type: 'TQueryData', default: `${typeName}["response"]` },
    { type: 'TQueryKey extends QueryKey', default: `${typeName}QueryKey` },
  ])

  queryKeyParams.add([
    ...(pathParamsType === 'object' ? [getASTParams(typedSchemas.pathParams)] : getASTParams(typedSchemas.pathParams)),
    {
      name: 'params',
      enabled: !!typedSchemas.queryParams?.name,
      required: !isOptional(typedSchemas.queryParams?.schema),
    },
    {
      name: 'data',
      enabled: !!typedSchemas.request?.name,
      required: !isOptional(typedSchemas.request?.schema),
    },
  ])

  const resultGenerics = [`${typeName}["response"]`, `${typeName}["error"]`, `${typeName}["request"]`]

  params.add([
    ...getASTParams(typedSchemas.pathParams, { typed: true }),
    {
      name: 'params',
      type: `${typeName}['queryParams']`,
      enabled: !!typedSchemas.queryParams?.name,
      required: !isOptional(typedSchemas.queryParams?.schema),
    },
    {
      name: 'headers',
      type: `${typeName}['headerParams']`,
      enabled: !!typedSchemas.headerParams?.name,
      required: !isOptional(typedSchemas.headerParams?.schema),
    },
    {
      name: 'options',
      required: false,
      type: `{
          mutation?: UseMutationOptions<${resultGenerics.join(', ')}>,
          client?: ${typeName}['client']['parameters']
      }`,
      default: '{}',
    },
  ])

  const isFormData = contentType === 'multipart/form-data'
  const headers = [
    contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined,
    typedSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)
  const clientGenerics = [`${typeName}['data']`, `${typeName}['error']`]
  const clientParams = createFunctionParams({
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
  })

  const client = (
    <>
      <Function.Call name="res" to={<Function name="client" async generics={clientGenerics.join(', ')} params={clientParams} />} />
      <Function.Return>
        {dataReturnType === 'data'
          ? parser === 'zod'
            ? `{...res, data: ${zodSchemas.response.name}.parse(res.data)}`
            : 'res.data'
          : parser === 'zod'
            ? `${zodSchemas.response.name}.parse(res)`
            : 'res'}
      </Function.Return>
    </>
  )

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
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        params={params.toString()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
       const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

       return useMutation({
         mutationFn: async(data) => {
           ${formData || ''}
          `}
        {client}
        {`
         ...mutationOptions
       })
       `}
      </Function>
    </File.Source>
  )
}
