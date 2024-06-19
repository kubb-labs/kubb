import client from '@kubb/swagger-client/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById'
import type {
  UseBaseQueryOptions,
  UseQueryResult,
  QueryKey,
  WithRequired,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query'

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
export function getPetByIdQueryOptions<TData = GetPetById['response'], TQueryData = GetPetById['response']>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getPetByIdQueryKey(petId)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<GetPetById['data'], GetPetById['error']>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetByIdHook<TData = GetPetById['response'], TQueryData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<UseBaseQueryOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseQueryResult<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)
  const query = useQuery<GetPetById['data'], GetPetById['error'], TData, any>({
    ...getPetByIdQueryOptions<TData, TQueryData>(petId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const getPetByIdInfiniteQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const
export type GetPetByIdInfiniteQueryKey = ReturnType<typeof getPetByIdInfiniteQueryKey>
export function getPetByIdInfiniteQueryOptions<TData = GetPetById['response'], TQueryData = GetPetById['response']>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['parameters'] = {},
): WithRequired<UseInfiniteQueryOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getPetByIdInfiniteQueryKey(petId)
  return {
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client<GetPetById['data'], GetPetById['error']>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetByIdHookInfinite<
  TData = InfiniteData<GetPetById['response']>,
  TQueryData = GetPetById['response'],
  TQueryKey extends QueryKey = GetPetByIdInfiniteQueryKey,
>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<UseInfiniteQueryOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseInfiniteQueryResult<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdInfiniteQueryKey(petId)
  const query = useInfiniteQuery<GetPetById['data'], GetPetById['error'], TData, any>({
    ...getPetByIdInfiniteQueryOptions<TData, TQueryData>(petId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
