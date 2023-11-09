import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { KubbQueryFactory } from './types'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById'
import type { UseQueryReturnType, QueryObserverOptions, QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

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
export const getPetByIdQueryKey = (petId: MaybeRef<GetPetByIdPathParams['petId']>) => [{ url: `/pet/${unref(petId)}`, params: { petId: petId } }] as const
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>
export function getPetByIdQueryOptions<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
>(
  refPetId: MaybeRef<GetPetByIdPathParams['petId']>,
  options: GetPetById['client']['paramaters'] = {},
): QueryObserverOptions<GetPetById['unionResponse'], TError, TData, TQueryData, GetPetByIdQueryKey> {
  const queryKey = getPetByIdQueryKey(refPetId)
  return {
    queryKey,
    queryFn: () => {
      const petId = unref(refPetId)
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

export function useGetPetById<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  refPetId: GetPetByIdPathParams['petId'],
  options: {
    query?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    client?: GetPetById['client']['paramaters']
  } = {},
): UseQueryReturnType<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(refPetId)
  const query = useQuery<any, TError, TData, any>({
    ...getPetByIdQueryOptions<TQueryFnData, TError, TData, TQueryData>(refPetId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
