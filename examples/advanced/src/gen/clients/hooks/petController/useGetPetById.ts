import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById'
import type {
  QueryObserverOptions,
  UseQueryResult,
  QueryKey,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult,
  InfiniteData,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'
import { getPetByIdQueryResponseSchema } from '../../../zod/petController/getPetByIdSchema'
import client from '../../../../tanstack-query-client.ts'
import { useQuery, useInfiniteQuery, useSuspenseQuery } from '../../../../tanstack-query-hook.ts'
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query'

type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>

type GetPetById = {
  data: GetPetByIdQueryResponse
  error: GetPetById400 | GetPetById404
  request: never
  pathParams: GetPetByIdPathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<GetPetByIdClient>>
  client: {
    parameters: Partial<Parameters<GetPetByIdClient>[0]>
    return: Awaited<ReturnType<GetPetByIdClient>>
  }
}

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions(petId: GetPetByIdPathParams['petId'], options: GetPetById['client']['parameters'] = {}) {
  const queryKey = getPetByIdQueryKey(petId)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetPetById['data'], GetPetById['error']>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return { ...res, data: getPetByIdQueryResponseSchema.parse(res.data) }
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById<TData = GetPetById['response'], TQueryData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<QueryObserverOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseQueryResult<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)
  const query = useQuery({
    ...(getPetByIdQueryOptions(petId, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export const getPetByIdInfiniteQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdInfiniteQueryKey = ReturnType<typeof getPetByIdInfiniteQueryKey>

export function getPetByIdInfiniteQueryOptions(petId: GetPetByIdPathParams['petId'], options: GetPetById['client']['parameters'] = {}) {
  const queryKey = getPetByIdInfiniteQueryKey(petId)
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetPetById['data'], GetPetById['error']>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return { ...res, data: getPetByIdQueryResponseSchema.parse(res.data) }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1),
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => (firstPageParam <= 1 ? undefined : firstPageParam - 1),
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetByIdInfinite<
  TData = InfiniteData<GetPetById['response']>,
  TQueryData = GetPetById['response'],
  TQueryKey extends QueryKey = GetPetByIdInfiniteQueryKey,
>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<InfiniteQueryObserverOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdInfiniteQueryKey(petId)
  const query = useInfiniteQuery({
    ...(getPetByIdInfiniteQueryOptions(petId, clientOptions) as unknown as InfiniteQueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<InfiniteQueryObserverOptions, 'queryKey'>),
  }) as UseInfiniteQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

export const getPetByIdSuspenseQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdSuspenseQueryKey = ReturnType<typeof getPetByIdSuspenseQueryKey>

export function getPetByIdSuspenseQueryOptions(petId: GetPetByIdPathParams['petId'], options: GetPetById['client']['parameters'] = {}) {
  const queryKey = getPetByIdSuspenseQueryKey(petId)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetPetById['data'], GetPetById['error']>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return { ...res, data: getPetByIdQueryResponseSchema.parse(res.data) }
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetByIdSuspense<TData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdSuspenseQueryKey>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<UseSuspenseQueryOptions<GetPetById['response'], GetPetById['error'], TData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdSuspenseQueryKey(petId)
  const query = useSuspenseQuery({
    ...(getPetByIdSuspenseQueryOptions(petId, clientOptions) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
