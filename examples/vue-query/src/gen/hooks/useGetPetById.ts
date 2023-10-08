import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { QueryKey, UseQueryReturnType, UseQueryOptions } from '@tanstack/vue-query'
import { useQuery } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400 } from '../models/GetPetById'

export const getPetByIdQueryKey = (refPetId: MaybeRef<GetPetByIdPathParams['petId']>) => {
  const petId = unref(refPetId)
  return [`/pet/${petId}`] as const
}

export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = GetPetById400>(
  refPetId: MaybeRef<GetPetByIdPathParams['petId']>,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const petId = unref(refPetId)
  const queryKey = getPetByIdQueryKey(petId)

  return {
    queryKey,
    queryFn: () => {
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
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryReturnType<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(refPetId)

  const query = useQuery<TData, TError>({
    ...getPetByIdQueryOptions<TData, TError>(refPetId, clientOptions),
    ...queryOptions,
  }) as UseQueryReturnType<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
