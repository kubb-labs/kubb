import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function } from '@kubb/react'

import type { HttpMethod, Operation } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  options: PluginSwr['resolvedOptions']
  typedSchemas: OperationSchemas
  operation: Operation
}

export function Mutation({ name, typeName, options, typedSchemas, operation }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const returnType = `SWRMutationResponse<${[`${typeName}["response"]`, `${typeName}["error"]`].join(', ')}>`
  // TODO use params type
  const clientOptions = [
    `method: "${operation.method}"`,
    'url',
    typedSchemas.queryParams?.name ? 'params' : undefined,
    typedSchemas.request?.name ? 'data' : undefined,
    typedSchemas.headerParams?.name ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)

  const params = new FunctionParams()

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
      required: false,
      type: `{
        mutation?: SWRMutationConfiguration<${[`${typeName}["response"]`, `${typeName}["error"]`].join(', ')}>,
        client?: ${typeName}['client']['parameters'],
        shouldFetch?: boolean,
      }`,
      default: '{}',
    },
  ])

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`
  const clientGenerics = [`${typeName}["data"]`, `${typeName}["error"]`, typedSchemas.request?.name ? `${typeName}["request"]` : ''].filter(Boolean).join(', ')

  if (typedSchemas.queryParams?.name) {
    const hookGenerics = [`${typeName}["response"]`, `${typeName}["error"]`, '[typeof url, typeof params] | null'].join(', ')

    return (
      <Function
        export
        name={name}
        returnType={returnType}
        params={params.toString()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
         const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

         const url = ${path.template} as const
         return useSWRMutation<${hookGenerics}>(
          shouldFetch ? [url, params]: null,
          async (_url${typedSchemas.request?.name ? ', { arg: data }' : ''}) => {
            const res = await client<${clientGenerics}>({
              ${resolvedClientOptions}
            })

            return ${options.dataReturnType === 'data' ? 'res.data' : 'res'}
          },
          mutationOptions
        )
      `}
      </Function>
    )
  }

  const hookGenerics = [`${typeName}["response"]`, `${typeName}["error"]`, 'typeof url | null'].join(', ')

  return (
    <Function
      export
      name={name}
      returnType={returnType}
      params={params.toString()}
      JSDoc={{
        comments: getComments(operation),
      }}
    >
      {`
       const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${path.template} as const
       return useSWRMutation<${hookGenerics}>(
        shouldFetch ? url : null,
        async (_url${typedSchemas.request?.name ? ', { arg: data }' : ''}) => {
          const res = await client<${clientGenerics}>({
            ${resolvedClientOptions}
          })

          return ${options.dataReturnType === 'data' ? 'res.data' : 'res'}
        },
        mutationOptions
      )
    `}
    </Function>
  )
}
