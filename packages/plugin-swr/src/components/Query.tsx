import { FunctionParams, URLPath } from '@kubb/core/utils'
import { Function } from '@kubb/react'

import type { ReactNode } from 'react'
import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
import type { PluginClient } from '@kubb/plugin-client'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { Operation } from '@kubb/oas'
import type { PluginSwr } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  queryOptionsName: string
  options: PluginSwr['resolvedOptions']
  typedSchemas: OperationSchemas
  operation: Operation
}

export function Query({ name, typeName, queryOptionsName, typedSchemas, operation }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const returnType = `SWRResponse<${['TData', `${typeName}["error"]`].join(', ')}>`
  const queryParams = new FunctionParams()
  const params = new FunctionParams()

  queryParams.add([
    ...getASTParams(typedSchemas.pathParams, { typed: false }),
    {
      name: 'params',
      enabled: !!typedSchemas.queryParams?.name,
      required: false,
    },
    {
      name: 'headers',
      enabled: !!typedSchemas.headerParams?.name,
      required: false,
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

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
        query?: SWRConfiguration<${['TData', `${typeName}["error"]`].join(', ')}>,
        client?: ${typeName}['client']['parameters'],
        shouldFetch?: boolean,
      }`,
      default: '{}',
    },
  ])

  const queryOptions = `${queryOptionsName}<TData>(${queryParams.toString()})`

  if (typedSchemas.queryParams?.name) {
    const hookGenerics = ['TData', `${typeName}["error"]`, '[typeof url, typeof params] | null'].join(', ')

    return (
      <>
        <Function
          name={name}
          export
          generics={[`TData = ${typeName}["response"]`]}
          returnType={returnType}
          params={params.toString()}
          JSDoc={{
            comments: getComments(operation),
          }}
        >
          {`
         const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

         const url = ${path.template}
         const query = useSWR<${hookGenerics}>(
          shouldFetch ? [url, params]: null,
          {
            ...${queryOptions},
            ...queryOptions
          }
         )

         return query
         `}
        </Function>
      </>
    )
  }

  const hookGenerics = ['TData', `${typeName}["error"]`, 'typeof url | null'].join(', ')

  return (
    <>
      <Function
        name={name}
        export
        generics={[`TData = ${typeName}["response"]`]}
        returnType={returnType}
        params={params.toString()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
       const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${path.template}
       const query = useSWR<${hookGenerics}>(
        shouldFetch ? url : null,
        {
          ...${queryOptions},
          ...queryOptions
        }
       )

       return query
       `}
      </Function>
    </>
  )
}
