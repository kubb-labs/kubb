import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { ResellersControllerGetResellersQueryResponse } from '../../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { resellersControllerGetResellers } from '../../axios/ResellersService/resellersControllerGetResellers.ts'

export const resellersControllerGetResellersQueryKey = () => [{ url: '/api/resellers' }] as const

export type ResellersControllerGetResellersQueryKey = ReturnType<typeof resellersControllerGetResellersQueryKey>

export function resellersControllerGetResellersQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = resellersControllerGetResellersQueryKey()
  return queryOptions<
    ResponseConfig<ResellersControllerGetResellersQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<ResellersControllerGetResellersQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return resellersControllerGetResellers(config)
    },
  })
}

/**
 * {@link /api/resellers}
 */
export function useResellersControllerGetResellers<
  TData = ResponseConfig<ResellersControllerGetResellersQueryResponse>,
  TQueryData = ResponseConfig<ResellersControllerGetResellersQueryResponse>,
  TQueryKey extends QueryKey = ResellersControllerGetResellersQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<ResellersControllerGetResellersQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? resellersControllerGetResellersQueryKey()

  const query = useQuery(
    {
      ...resellersControllerGetResellersQueryOptions(config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
