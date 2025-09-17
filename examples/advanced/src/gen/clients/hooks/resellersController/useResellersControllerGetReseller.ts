import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  ResellersControllerGetResellerQueryResponse,
  ResellersControllerGetResellerPathParams,
} from '../../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { resellersControllerGetReseller } from '../../axios/ResellersService/resellersControllerGetReseller.ts'

export const resellersControllerGetResellerQueryKey = ({ id }: { id: ResellersControllerGetResellerPathParams['id'] }) =>
  [{ url: '/api/resellers/:id', params: { id: id } }] as const

export type ResellersControllerGetResellerQueryKey = ReturnType<typeof resellersControllerGetResellerQueryKey>

export function resellersControllerGetResellerQueryOptions(
  { id }: { id: ResellersControllerGetResellerPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = resellersControllerGetResellerQueryKey({ id })
  return queryOptions<
    ResponseConfig<ResellersControllerGetResellerQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<ResellersControllerGetResellerQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return resellersControllerGetReseller({ id }, config)
    },
  })
}

/**
 * {@link /api/resellers/:id}
 */
export function useResellersControllerGetReseller<
  TData = ResponseConfig<ResellersControllerGetResellerQueryResponse>,
  TQueryData = ResponseConfig<ResellersControllerGetResellerQueryResponse>,
  TQueryKey extends QueryKey = ResellersControllerGetResellerQueryKey,
>(
  { id }: { id: ResellersControllerGetResellerPathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<ResellersControllerGetResellerQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? resellersControllerGetResellerQueryKey({ id })

  const query = useQuery(
    {
      ...resellersControllerGetResellerQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
