import client from '@kubb/plugin-client/clients/axios'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'
import { queryOptions, createQuery } from '@tanstack/svelte-query'

export const getPetByIdQueryKey = (pet_id: GetPetByIdPathParams['pet_id']) => [{ url: '/pet/:pet_id', params: { pet_id: pet_id } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:pet_id}
 */
export async function getPetById(pet_id: GetPetByIdPathParams['pet_id'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: `/pet/${pet_id}`,
    ...requestConfig,
  })
  return res.data
}

export function getPetByIdQueryOptions(pet_id: GetPetByIdPathParams['pet_id'], config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const queryKey = getPetByIdQueryKey(pet_id)
  return queryOptions<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, GetPetByIdQueryResponse, typeof queryKey>({
    enabled: !!pet_id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getPetById(pet_id, config)
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:pet_id}
 */
export function createGetPetById<TData = GetPetByIdQueryResponse, TQueryData = GetPetByIdQueryResponse, TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  pet_id: GetPetByIdPathParams['pet_id'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(pet_id)

  const query = createQuery({
    ...(getPetByIdQueryOptions(pet_id, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, ResponseErrorConfig<GetPetById400 | GetPetById404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
