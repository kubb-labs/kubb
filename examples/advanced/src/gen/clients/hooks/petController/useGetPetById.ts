import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdQueryKey = ({ petId }: { petId: GetPetByIdPathParams['petId'] }) => [{ url: '/pet/:petId:search', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = getPetByIdQueryKey({ petId })
  return queryOptions<
    ResponseConfig<GetPetByIdQueryResponse>,
    ResponseErrorConfig<GetPetById400 | GetPetById404>,
    ResponseConfig<GetPetByIdQueryResponse>,
    typeof queryKey
  >({
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
 * {@link /pet/:petId:search}
 */
export function useGetPetById<
  TData = ResponseConfig<GetPetByIdQueryResponse>,
  TQueryData = ResponseConfig<GetPetByIdQueryResponse>,
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  { petId }: { petId: GetPetByIdPathParams['petId'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<GetPetByIdQueryResponse>, ResponseErrorConfig<GetPetById400 | GetPetById404>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey({ petId })

  const query = useQuery(
    {
      ...getPetByIdQueryOptions({ petId }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetPetById400 | GetPetById404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
