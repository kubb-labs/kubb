import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { AppControllerGetStatusQueryResponse } from '../../../models/ts/appController/AppControllerGetStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { appControllerGetStatus } from '../../axios/AppService/appControllerGetStatus.ts'

export const appControllerGetStatusQueryKey = () => [{ url: '/api/status' }] as const

export type AppControllerGetStatusQueryKey = ReturnType<typeof appControllerGetStatusQueryKey>

export function appControllerGetStatusQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = appControllerGetStatusQueryKey()
  return queryOptions<
    ResponseConfig<AppControllerGetStatusQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<AppControllerGetStatusQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return appControllerGetStatus(config)
    },
  })
}

/**
 * {@link /api/status}
 */
export function useAppControllerGetStatus<
  TData = ResponseConfig<AppControllerGetStatusQueryResponse>,
  TQueryData = ResponseConfig<AppControllerGetStatusQueryResponse>,
  TQueryKey extends QueryKey = AppControllerGetStatusQueryKey,
>(
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<AppControllerGetStatusQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? appControllerGetStatusQueryKey()

  const query = useQuery(
    {
      ...appControllerGetStatusQueryOptions(config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
