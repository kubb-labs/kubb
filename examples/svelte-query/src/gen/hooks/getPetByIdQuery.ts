import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult, CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from '@tanstack/svelte-query'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById'

type GetPetById = KubbQueryFactory<
  GetPetByIdQueryResponse,
  GetPetById400 | GetPetById404,
  never,
  GetPetByIdPathParams,
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
}
/**
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
export function getPetByIdQueryOptionsInfinite<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['paramaters'] = {},
): CreateInfiniteQueryOptions<GetPetById['unionResponse'], TError, TData, TQueryData, GetPetByIdQueryKey> {
  const queryKey = getPetByIdQueryKey(petId)
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
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetByIdQueryInfinite<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetPetById['client']['paramaters']
  } = {},
): CreateInfiniteQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)
  const query = createInfiniteQuery<TQueryFnData, TError, TData, any>({
    ...getPetByIdQueryOptionsInfinite<TQueryFnData, TError, TData, TQueryData>(petId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as CreateInfiniteQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
