import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function } from '@kubb/react'

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
  queryOptionsName: string
  queryKeyName: string
  typedSchemas: OperationSchemas
  operation: Operation
  pathParamsType: PluginReactQuery['resolvedOptions']['query']['pathParamsType']
}

export function Query({ name, typeName, queryOptionsName, queryKeyName, pathParamsType, typedSchemas, operation }: Props): ReactNode {
  const returnType = `UseQueryResult<${['TData', `${typeName}["error"]`].join(', ')}> & { queryKey: TQueryKey }`
  const queryOptionsOverrideGenerics = [`${typeName}['response']`, `${typeName}['error']`, 'TData', 'TQueryData', 'TQueryKey']
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
          query?: Partial<QueryObserverOptions<${queryOptionsOverrideGenerics.join(', ')}>>,
          client?: ${typeName}['client']['parameters']
      }`,
      default: '{}',
    },
  ])

  const queryOptions = `${queryOptionsName}(${queryParams.toString()})`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={generics.toString()}
        returnType={returnType}
        params={params.toString()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
       const { query: queryOptions, client: clientOptions = {} } = options ?? {}
       const queryKey = queryOptions?.queryKey ?? ${queryKeyName}(${queryKeyParams.toString()})

       const query = useQuery({
        ...${queryOptions} as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
       }) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}
