import { useQuery } from '@tanstack/react-query'

import client from '../../../client'

import type { QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import type { FindPetsByStatusResponse, FindPetsByStatusQueryParams } from '../../models/ts/FindPetsByStatus'

export const findPetsByStatusQueryKey = (params?: FindPetsByStatusQueryParams) => [`/pet/findByStatus`, ...(params ? [params] : [])] as const

export const findPetsByStatusQueryOptions = <TData = FindPetsByStatusResponse>(params?: FindPetsByStatusQueryParams): QueryOptions<TData> => {
  const queryKey = findPetsByStatusQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
      })
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export const useFindPetsByStatus = <TData = FindPetsByStatusResponse>(
  params?: FindPetsByStatusQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)

  const query = useQuery<TData>({
    ...findPetsByStatusQueryOptions<TData>(params),
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
