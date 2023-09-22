import {
  useQuery,
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  QueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query'
import client from '../../../../client'
import type { FindPetsByStatusQueryResponse, FindpetsbystatusQueryparams, Findpetsbystatus400 } from '../../../models/ts/petController/FindPetsByStatus'

export const findPetsByStatusQueryKey = (params?: FindpetsbystatusQueryparams) => [`/pet/findByStatus`, ...(params ? [params] : [])] as const

export function findPetsByStatusQueryOptions<TData = FindPetsByStatusQueryResponse, TError = Findpetsbystatus400>(
  params?: FindpetsbystatusQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByStatusQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,

        ...options,
      })
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindpetsbystatus<TData = FindPetsByStatusQueryResponse, TError = Findpetsbystatus400>(
  params?: FindpetsbystatusQueryparams,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)

  const query = useQuery<TData, TError>({
    ...findPetsByStatusQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function findPetsByStatusQueryOptionsInfinite<TData = FindPetsByStatusQueryResponse, TError = Findpetsbystatus400>(
  params?: FindpetsbystatusQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = findPetsByStatusQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,

        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      })
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindpetsbystatusInfinite<TData = FindPetsByStatusQueryResponse, TError = Findpetsbystatus400>(
  params?: FindpetsbystatusQueryparams,
  options: {
    query?: UseInfiniteQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...findPetsByStatusQueryOptionsInfinite<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
