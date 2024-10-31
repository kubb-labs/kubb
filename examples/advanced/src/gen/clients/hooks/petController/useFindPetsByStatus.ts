import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook.ts'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

export const findPetsByStatusQueryKey = (params?: FindPetsByStatusQueryParams) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
async function findPetsByStatus(
  {
    params,
  }: {
    params?: FindPetsByStatusQueryParams
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({ method: 'GET', url: '/pet/findByStatus', params, ...config })
  return { ...res, data: findPetsByStatusQueryResponseSchema.parse(res.data) }
}

export function findPetsByStatusQueryOptions(
  {
    params,
  }: {
    params?: FindPetsByStatusQueryParams
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByStatus({ params }, config)
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatus<
  TData = ResponseConfig<FindPetsByStatusQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByStatusQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  {
    params,
  }: {
    params?: FindPetsByStatusQueryParams
  },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<FindPetsByStatusQueryResponse>, FindPetsByStatus400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery({
    ...(findPetsByStatusQueryOptions({ params }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByStatus400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
