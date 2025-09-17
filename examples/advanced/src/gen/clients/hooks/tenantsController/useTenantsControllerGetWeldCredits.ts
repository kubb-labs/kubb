import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  TenantsControllerGetWeldCreditsQueryResponse,
  TenantsControllerGetWeldCreditsPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { tenantsControllerGetWeldCredits } from '../../axios/TenantsService/tenantsControllerGetWeldCredits.ts'

export const tenantsControllerGetWeldCreditsQueryKey = ({ id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] }) =>
  [{ url: '/api/tenants/:id/weld-credits', params: { id: id } }] as const

export type TenantsControllerGetWeldCreditsQueryKey = ReturnType<typeof tenantsControllerGetWeldCreditsQueryKey>

export function tenantsControllerGetWeldCreditsQueryOptions(
  { id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = tenantsControllerGetWeldCreditsQueryKey({ id })
  return queryOptions<
    ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return tenantsControllerGetWeldCredits({ id }, config)
    },
  })
}

/**
 * {@link /api/tenants/:id/weld-credits}
 */
export function useTenantsControllerGetWeldCredits<
  TData = ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>,
  TQueryData = ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>,
  TQueryKey extends QueryKey = TenantsControllerGetWeldCreditsQueryKey,
>(
  { id }: { id: TenantsControllerGetWeldCreditsPathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<TenantsControllerGetWeldCreditsQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? tenantsControllerGetWeldCreditsQueryKey({ id })

  const query = useQuery(
    {
      ...tenantsControllerGetWeldCreditsQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
