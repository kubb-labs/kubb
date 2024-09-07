import transformers from '@kubb/core/transformers'
import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationSchemas } from '@kubb/plugin-oas'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  typedSchemas: OperationSchemas
  operation: Operation
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
}

export function Mutation({ name, typeName, dataReturnType, typedSchemas, operation }: Props): ReactNode {
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
      <File.Source name={name} isExportable isIndexable>
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

            return ${dataReturnType === 'data' ? 'res.data' : 'res'}
          },
          mutationOptions
        )
      `}
        </Function>
      </File.Source>
    )
  }

  const hookGenerics = [`${typeName}["response"]`, `${typeName}["error"]`, 'Key'].join(', ')

  return (
    <File.Source name={name} isExportable isIndexable>
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

          return ${dataReturnType === 'data' ? 'res.data' : 'res'}
        },
        mutationOptions
      )
    `}
      </Function>
    </File.Source>
  )
}
