import client from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

export const getPetByIdQueryKey = ({
  petId,
}: {
  petId: GetPetByIdPathParams['petId']
}) => ['v5', { url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
async function getPetById({ petId }: GetPetByIdPathParams, config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

export function getPetByIdQueryOptionsHook({ petId }: GetPetByIdPathParams, config: Partial<RequestConfig> = {}) {
  const queryKey = getPetByIdQueryKey({ petId })
  return queryOptions({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getPetById({ petId }, config)
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetByIdHook<TData = GetPetByIdQueryResponse, TQueryData = GetPetByIdQueryResponse, TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  { petId }: GetPetByIdPathParams,
  options: {
    query?: Partial<QueryObserverOptions<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey({ petId })
  const query = useQuery({
    ...(getPetByIdQueryOptionsHook({ petId }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetPetById400 | GetPetById404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
