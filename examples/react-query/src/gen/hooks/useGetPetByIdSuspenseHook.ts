import client from '@kubb/plugin-client/client'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'

export const getPetByIdSuspenseQueryKey = ({
  petId,
}: {
  petId: GetPetByIdPathParams['petId']
}) => ['v5', { url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdSuspenseQueryKey = ReturnType<typeof getPetByIdSuspenseQueryKey>

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

export function getPetByIdSuspenseQueryOptionsHook({ petId }: GetPetByIdPathParams, config: Partial<RequestConfig> = {}) {
  const queryKey = getPetByIdSuspenseQueryKey({ petId })
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
export function useGetPetByIdSuspenseHook<
  TData = GetPetByIdQueryResponse,
  TQueryData = GetPetByIdQueryResponse,
  TQueryKey extends QueryKey = GetPetByIdSuspenseQueryKey,
>(
  { petId }: GetPetByIdPathParams,
  options: {
    query?: Partial<UseSuspenseQueryOptions<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdSuspenseQueryKey({ petId })
  const query = useSuspenseQuery({
    ...(getPetByIdSuspenseQueryOptionsHook({ petId }, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, GetPetById400 | GetPetById404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
