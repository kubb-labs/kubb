import client from '@kubb/swagger-client/client'

import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'

import type { QueryKey, QueryObserverOptions, UseQueryOptions, UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { GetPetById400, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../models/GetPetById'

export const getPetByIdQueryKey = (petId: MaybeRef<GetPetByIdPathParams['petId']>) => [{ url: `/pet/${unref(petId)}`, params: { petId: petId } }] as const
export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = GetPetById400>(
  refPetId: MaybeRef<GetPetByIdPathParams['petId']>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getPetByIdQueryKey(refPetId)

  return {
    queryKey,
    queryFn: () => {
      const petId = unref(refPetId)
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function useGetPetById<TData = GetPetByIdQueryResponse, TError = GetPetById400>(
  refPetId: MaybeRef<GetPetByIdPathParams['petId']>,
  options: {
    query?: QueryObserverOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(refPetId)

  const query = useQuery<TData, TError>({
    ...getPetByIdQueryOptions<TData, TError>(refPetId, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
