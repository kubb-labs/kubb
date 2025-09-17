import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { PartsControllerGetPartsQueryResponse } from '../../../models/ts/partsController/PartsControllerGetParts.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { partsControllerGetParts } from '../../axios/PartsService/partsControllerGetParts.ts'

export const partsControllerGetPartsQueryKey = () => [{ url: '/api/parts' }] as const

export type PartsControllerGetPartsQueryKey = ReturnType<typeof partsControllerGetPartsQueryKey>

export function partsControllerGetPartsQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = partsControllerGetPartsQueryKey()
  return queryOptions<
    ResponseConfig<PartsControllerGetPartsQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<PartsControllerGetPartsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return partsControllerGetParts(config)
    },
  })
}

/**
 * {@link /api/parts}
 */
export function usePartsControllerGetParts<
  TData = ResponseConfig<PartsControllerGetPartsQueryResponse>,
  TQueryData = ResponseConfig<PartsControllerGetPartsQueryResponse>,
  TQueryKey extends QueryKey = PartsControllerGetPartsQueryKey,
>(
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<PartsControllerGetPartsQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? partsControllerGetPartsQueryKey()

  const query = useQuery(
    {
      ...partsControllerGetPartsQueryOptions(config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
