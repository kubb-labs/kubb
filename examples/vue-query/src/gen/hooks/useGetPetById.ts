import client from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { QueryObserverOptions, UseQueryReturnType, QueryKey } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useQuery, queryOptions } from '@tanstack/vue-query'
import { unref } from 'vue'

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

export function getPetByIdQueryOptions(refPetId: MaybeRef<GetPetByIdPathParams['petId']>, options: GetPetById['client']['parameters'] = {}) {
  const queryKey = getPetByIdQueryKey(refPetId)
  return queryOptions({
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
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById<TData = GetPetById['response'], TQueryData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  refPetId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<QueryObserverOptions<GetPetById['response'], GetPetById['error'], TData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): UseQueryReturnType<TData, GetPetById['error']> {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(refPetId)
  const query = useQuery({
    ...(getPetByIdQueryOptions(refPetId, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
