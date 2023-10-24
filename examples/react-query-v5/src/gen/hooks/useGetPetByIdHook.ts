import client from '@kubb/swagger-client/client'

import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  QueryKey,
  QueryObserverOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { GetPetById400, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../models/GetPetById'

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: `/pet/${petId}`, params: { petId: petId } }] as const
export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = GetPetById400>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getPetByIdQueryKey(petId)

  return queryOptions<TData, TError>({
    queryKey: queryKey as QueryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,

        ...options,
      }).then(res => res.data)
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function useGetPetByIdHook<TData = GetPetByIdQueryResponse, TError = GetPetById400>(petId: GetPetByIdPathParams['petId'], options: {
  query?: QueryObserverOptions<TData, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)

  const query = useQuery<TData, TError>({
    ...getPetByIdQueryOptions<TData, TError>(petId, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

export function getPetByIdQueryOptionsInfinite<
  TData = GetPetByIdQueryResponse,
  TError = GetPetById400,
  TInfiniteDate = InfiniteData<GetPetByIdQueryResponse extends [] ? GetPetByIdQueryResponse[number] : GetPetByIdQueryResponse>,
>(petId: GetPetByIdPathParams['petId'], options: Partial<Parameters<typeof client>[0]> = {}): UseInfiniteQueryOptions<TData, TError, TInfiniteDate> {
  const queryKey = getPetByIdQueryKey(petId)

  return infiniteQueryOptions<TData, TError, TInfiniteDate>({
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,

        ...options,
      }).then(res => res.data)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage['id'],
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function useGetPetByIdHookInfinite<
  TData = GetPetByIdQueryResponse,
  TError = GetPetById400,
  TInfiniteDate = InfiniteData<GetPetByIdQueryResponse extends [] ? GetPetByIdQueryResponse[number] : GetPetByIdQueryResponse>,
>(petId: GetPetByIdPathParams['petId'], options: {
  query?: InfiniteQueryObserverOptions<TData, TError, TInfiniteDate>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
} = {}): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)

  const query = useInfiniteQuery<TData, TError, TInfiniteDate>({
    ...getPetByIdQueryOptionsInfinite<TData, TError, TInfiniteDate>(petId, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
