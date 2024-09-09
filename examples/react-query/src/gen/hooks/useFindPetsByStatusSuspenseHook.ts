import client from '@kubb/plugin-client/client'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'

export const findPetsByStatusSuspenseQueryKey = (params?: FindPetsByStatusQueryParams) =>
  ['v5', { url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusSuspenseQueryKey = ReturnType<typeof findPetsByStatusSuspenseQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({
    method: 'get',
    url: '/pet/findByStatus',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}

export function findPetsByStatusSuspenseQueryOptions(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const queryKey = findPetsByStatusSuspenseQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return findPetsByStatus(params, config)
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatusSuspenseHook<
  TData = FindPetsByStatusQueryResponse,
  TQueryData = FindPetsByStatusQueryResponse,
  TQueryKey extends QueryKey = FindPetsByStatusSuspenseQueryKey,
>(
  params?: FindPetsByStatusQueryParams,
  options: {
    query?: Partial<UseSuspenseQueryOptions<FindPetsByStatusQueryResponse, FindPetsByStatus400, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusSuspenseQueryKey(params)
  const query = useSuspenseQuery({
    ...(findPetsByStatusSuspenseQueryOptions(params, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, FindPetsByStatus400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
