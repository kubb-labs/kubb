import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import { useQuery, queryOptions } from '../../../../tanstack-query-hook.ts'
import { getPetByIdQueryResponseSchema } from '../../../zod/petController/getPetByIdSchema.ts'

export const getPetByIdQueryKey = ({
  petId,
}: {
  petId: GetPetByIdPathParams['petId']
}) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
async function getPetById(
  {
    pathParams: { petId },
  }: {
    pathParams: GetPetByIdPathParams
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return { ...res, data: getPetByIdQueryResponseSchema.parse(res.data) }
}

export function getPetByIdQueryOptions(
  {
    pathParams: { petId },
  }: {
    pathParams: GetPetByIdPathParams
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = getPetByIdQueryKey({ petId })
  return queryOptions({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getPetById({ pathParams: { petId } }, config)
    },
  })
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById<
  TData = ResponseConfig<GetPetByIdQueryResponse>,
  TQueryData = ResponseConfig<GetPetByIdQueryResponse>,
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(
  {
    pathParams: { petId },
  }: {
    pathParams: GetPetByIdPathParams
  },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<GetPetByIdQueryResponse>, GetPetById400 | GetPetById404, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey({ petId })
  const query = useQuery({
    ...(getPetByIdQueryOptions({ pathParams: { petId } }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, GetPetById400 | GetPetById404> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
