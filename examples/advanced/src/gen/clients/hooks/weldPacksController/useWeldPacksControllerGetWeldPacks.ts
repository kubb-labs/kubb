import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { WeldPacksControllerGetWeldPacksQueryResponse } from '../../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { weldPacksControllerGetWeldPacks } from '../../axios/WeldPacksService/weldPacksControllerGetWeldPacks.ts'

export const weldPacksControllerGetWeldPacksQueryKey = () => [{ url: '/api/weldpacks' }] as const

export type WeldPacksControllerGetWeldPacksQueryKey = ReturnType<typeof weldPacksControllerGetWeldPacksQueryKey>

export function weldPacksControllerGetWeldPacksQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = weldPacksControllerGetWeldPacksQueryKey()
  return queryOptions<
    ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return weldPacksControllerGetWeldPacks(config)
    },
  })
}

/**
 * {@link /api/weldpacks}
 */
export function useWeldPacksControllerGetWeldPacks<
  TData = ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>,
  TQueryData = ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>,
  TQueryKey extends QueryKey = WeldPacksControllerGetWeldPacksQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<WeldPacksControllerGetWeldPacksQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? weldPacksControllerGetWeldPacksQueryKey()

  const query = useQuery(
    {
      ...weldPacksControllerGetWeldPacksQueryOptions(config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
