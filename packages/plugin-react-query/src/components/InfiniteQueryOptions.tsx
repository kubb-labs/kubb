import { getPathParams } from '@kubb/plugin-oas/utils'
import { File, Function, FunctionParams } from '@kubb/react'

import type { ReactNode } from 'react'

import { isOptional } from '@kubb/oas'
import { Client } from '@kubb/plugin-client/components'
import type { OperationSchemas } from '@kubb/plugin-oas'
import type { Infinite, PluginReactQuery } from '../types.ts'
import { QueryKey } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  typeSchemas: OperationSchemas
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  initialPageParam: Infinite['initialPageParam']
  cursorParam: Infinite['cursorParam']
  queryParam: Infinite['queryParam']
}

type GetParamsProps = {
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
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
      type: typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>>` : 'Partial<RequestConfig>',
      default: '{}',
    },
  })
}

export function InfiniteQueryOptions({
  name,
  clientName,
  initialPageParam,
  cursorParam,
  typeSchemas,
  dataReturnType,
  pathParamsType,
  queryParam,
  queryKeyName,
}: Props): ReactNode {
  const params = getParams({ pathParamsType, typeSchemas })
  const clientParams = Client.getParams({
    typeSchemas,
    pathParamsType,
  })
  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    typeSchemas,
  })

  const queryOptions = [
    `initialPageParam: ${typeof initialPageParam === 'string' ? JSON.stringify(initialPageParam) : initialPageParam}`,
    cursorParam ? `getNextPageParam: (lastPage) => lastPage['${cursorParam}']` : undefined,
    cursorParam ? `getPreviousPageParam: (firstPage) => firstPage['${cursorParam}']` : undefined,
    !cursorParam && dataReturnType === 'full'
      ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1'
      : undefined,
    !cursorParam && dataReturnType === 'data'
      ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1'
      : undefined,
    !cursorParam ? 'getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1' : undefined,
  ].filter(Boolean)

  const infiniteOverrideParams =
    queryParam && typeSchemas.queryParams?.name
      ? `
          if(params) {
           params['${queryParam}'] = pageParam as unknown as ${typeSchemas.queryParams?.name}['${queryParam}']
          }`
      : ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParams.toCall()})
      return infiniteQueryOptions({
       queryKey,
       queryFn: async ({ pageParam }) => {
          ${infiniteOverrideParams}
          return ${clientName}(${clientParams.toCall()})
       },
       ${queryOptions.join('\n')}
      })
`}
      </Function>
    </File.Source>
  )
}

InfiniteQueryOptions.getParams = getParams
