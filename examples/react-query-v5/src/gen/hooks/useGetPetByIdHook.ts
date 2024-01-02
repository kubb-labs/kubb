import client from '@kubb/swagger-client/client'
import { useQuery, queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById'
import type { QueryObserverOptions, UseQueryResult, QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'

type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>
type GetPetById = {
  data: GetPetByIdQueryResponse
  error: GetPetById400 | GetPetById404
  request: never
  pathParams: GetPetByIdPathParams
  queryParams: never
  headerParams: never
  response: GetPetByIdQueryResponse
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
      return res.data
    },
  })
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId */
export function useGetPetByIdHook<TData = GetPetById['response'], TQueryData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdQueryKey>(
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
    ...getPetByIdQueryOptions(petId, clientOptions) as QueryObserverOptions,
    queryKey,
    ...queryOptions as unknown as QueryObserverOptions,
  }) as UseQueryResult<TData, GetPetById['error']> & {
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
      return res.data
    },
  })
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId */
export function useGetPetByIdHookSuspense<TData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdSuspenseQueryKey>(
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
    ...getPetByIdSuspenseQueryOptions(petId, clientOptions) as QueryObserverOptions,
    queryKey,
    ...queryOptions as unknown as QueryObserverOptions,
  }) as UseSuspenseQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
