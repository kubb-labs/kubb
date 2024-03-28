import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import type { QueryKey, UseQueryReturnType, WithRequired } from '@tanstack/vue-query'
import type { VueQueryObserverOptions } from '@tanstack/vue-query/build/lib/types'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../models/GetPetById'

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
export const getPetByIdQueryKey = (petId: MaybeRef<GetPetByIdPathParams['petId']>) => [{ url: '/pet/:petId', params: { petId: petId } }] as const
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>
export function getPetByIdQueryOptions<TData = GetPetById['response'], TQueryData = GetPetById['response']>(
  refPetId: MaybeRef<GetPetByIdPathParams['petId']>,
  options: GetPetById['client']['parameters'] = {},
): WithRequired<VueQueryObserverOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = getPetByIdQueryKey(refPetId)
  return {
    queryKey,
    queryFn: async () => {
      const petId = unref(refPetId)
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
export function useGetPetById<TData = GetPetById['response'], TQueryData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  refPetId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<VueQueryObserverOptions<GetPetById['response'], GetPetById['error'], TData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseQueryReturnType<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(refPetId)
  const query = useQuery<GetPetById['data'], GetPetById['error'], TData, any>({
    ...getPetByIdQueryOptions<TData, TQueryData>(refPetId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
