import client from '@kubb/swagger-client/client'
import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import type { KubbQueryFactory } from './types'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'

type GetPetById = KubbQueryFactory<
  GetPetByIdQueryResponse,
  GetPetById400 | GetPetById404,
  never,
  GetPetByIdPathParams,
  never,
  never,
  GetPetByIdQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: `/pet/${petId}`, params: { petId: petId } }] as const
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>
export function getPetByIdQueryOptions<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['paramaters'] = {},
): CreateBaseQueryOptions<GetPetById['unionResponse'], TError, TData, TQueryData, GetPetByIdQueryKey> {
  const queryKey = getPetByIdQueryKey(petId)
  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function getPetByIdQuery<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetPetById['client']['paramaters']
  } = {},
): CreateQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)
  const query = createQuery<TQueryFnData, TError, TData, any>({
    ...getPetByIdQueryOptions<TQueryFnData, TError, TData, TQueryData>(petId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
type GetPetByIdInfinite = KubbQueryFactory<
  GetPetByIdQueryResponse,
  GetPetById400 | GetPetById404,
  never,
  GetPetByIdPathParams,
  never,
  never,
  GetPetByIdQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getPetByIdInfiniteQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: `/pet/${petId}`, params: { petId: petId } }] as const
export type GetPetByIdInfiniteQueryKey = ReturnType<typeof getPetByIdInfiniteQueryKey>
export function getPetByIdInfiniteQueryOptions<
  TQueryFnData extends GetPetByIdInfinite['data'] = GetPetByIdInfinite['data'],
  TError = GetPetByIdInfinite['error'],
  TData = GetPetByIdInfinite['response'],
  TQueryData = GetPetByIdInfinite['response'],
>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetByIdInfinite['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<GetPetByIdInfinite['unionResponse'], TError, TData, TQueryData, GetPetByIdInfiniteQueryKey> {
  const queryKey = getPetByIdInfiniteQueryKey(petId)
  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      }).then((res) => res?.data || res)
    },
  }
} /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function getPetByIdQueryInfinite<
  TQueryFnData extends GetPetByIdInfinite['data'] = GetPetByIdInfinite['data'],
  TError = GetPetByIdInfinite['error'],
  TData = GetPetByIdInfinite['response'],
  TQueryData = GetPetByIdInfinite['response'],
  TQueryKey extends QueryKey = GetPetByIdInfiniteQueryKey,
>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetPetByIdInfinite['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdInfiniteQueryKey(petId)
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...getPetByIdInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData>(petId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
