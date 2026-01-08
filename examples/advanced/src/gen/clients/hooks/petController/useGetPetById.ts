import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type { GetPetByIdPathParams, GetPetByIdResponseData, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/petController/GetPetById.ts'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdQueryKey = ({ petId }: { petId: GetPetByIdPathParams['petId'] }) => [{ url: '/pet/:petId:search', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

export function getPetByIdQueryOptions({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = getPetByIdQueryKey({ petId })
  return queryOptions<
    ResponseConfig<GetPetByIdResponseData>,
    ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>,
    ResponseConfig<GetPetByIdResponseData>,
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
  TData = ResponseConfig<GetPetByIdResponseData>,
  TQueryData = ResponseConfig<GetPetByIdResponseData>,
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  { petId }: { petId: GetPetByIdPathParams['petId'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<GetPetByIdResponseData>, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, TData, TQueryData, TQueryKey>
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
  ) as UseQueryResult<TData, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
