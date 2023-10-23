import client from '@kubb/swagger-client/client'

import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

import type { QueryKey, QueryObserverOptions, UseQueryOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../models/FindPetsByStatus'

export const findPetsByStatusQueryKey = (params?: MaybeRef<FindPetsByStatusQueryParams>) => [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
export function findPetsByStatusQueryOptions<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  refParams?: MaybeRef<FindPetsByStatusQueryParams>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByStatusQueryKey(refParams)

  return {
    queryKey,
    queryFn: () => {
      const params = unref(refParams)
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindPetsByStatus<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  refParams?: MaybeRef<FindPetsByStatusQueryParams>,
  options: {
    query?: QueryObserverOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(refParams)

  const query = useQuery<TData, TError>({
    ...findPetsByStatusQueryOptions<TData, TError>(refParams, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
