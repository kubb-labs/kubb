import { FunctionParams, URLPath } from '@kubb/core/utils'
import { File, Function } from '@kubb/react'

import { type Operation, isOptional } from '@kubb/oas'
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
  queryOptionsName: string
  typeSchemas: OperationSchemas
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  operation: Operation
}

export function Query({ name, typeName, queryOptionsName, typeSchemas, operation, pathParamsType }: Props): ReactNode {
  const path = new URLPath(operation.path)
  const generics = [`TData = ${typeName}['response']`]
  const resultGenerics = ['TData', `${typeName}['error']`]
  const hookGenerics = ['TData', `${typeName}["error"]`, 'typeof url | null']

  const queryOptionsParams = new FunctionParams()
  const params = new FunctionParams()

  queryOptionsParams.add([
    ...getASTParams(typeSchemas.pathParams, { typed: false }),
    {
      name: 'params',
      enabled: !!typeSchemas.queryParams?.name,
      required: !isOptional(typeSchemas.queryParams?.schema),
    },
    {
      name: 'headers',
      enabled: !!typeSchemas.headerParams?.name,
      required: !isOptional(typeSchemas.headerParams?.schema),
    },
    {
      name: 'clientOptions',
      required: false,
    },
  ])

  params.add([
    ...getASTParams(typeSchemas.pathParams, { typed: true }),
    {
      name: 'params',
      type: `${typeName}['queryParams']`,
      enabled: !!typeSchemas.queryParams?.name,
      required: !isOptional(typeSchemas.queryParams?.schema),
    },
    {
      name: 'headers',
      type: `${typeName}['headerParams']`,
      enabled: !!typeSchemas.headerParams?.name,
      required: !isOptional(typeSchemas.headerParams?.schema),
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

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={generics.join(', ')}
        returnType={`SWRResponse<${resultGenerics.join(', ')}>`}
        params={params.toString()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
       const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${path.template}
       const query = useSWR<${hookGenerics.join(', ')}>(
        shouldFetch ? url : null,
        {
          ...${queryOptionsName}<TData>(${queryOptionsParams.toString()}),
          ...queryOptions
        }
       )

       return query
       `}
      </Function>
    </File.Source>
  )
}
