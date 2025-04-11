import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { queryOptions, useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

export const findPetsByStatusQueryKey = (params?: MaybeRef<FindPetsByStatusQueryParams>) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: '/pet/findByStatus',
    params,
    ...requestConfig,
  })
  return res.data
}

export function findPetsByStatusQueryOptions(params?: MaybeRef<FindPetsByStatusQueryParams>, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = findPetsByStatusQueryKey(params)
  return queryOptions<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryResponse, typeof queryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByStatus(unref(params), unref(config))
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export function useFindPetsByStatus<
  TData = FindPetsByStatusQueryResponse,
  TQueryData = FindPetsByStatusQueryResponse,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  params?: MaybeRef<FindPetsByStatusQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const {
    query: { client: queryClient, ...queryOptions } = {},
    client: config = {},
  } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)

  const query = useQuery(
    {
      ...(findPetsByStatusQueryOptions(params, config) as unknown as QueryObserverOptions),
      queryKey: queryKey as QueryKey,
      ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
    },
    queryClient,
  ) as UseQueryReturnType<TData, ResponseErrorConfig<FindPetsByStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
