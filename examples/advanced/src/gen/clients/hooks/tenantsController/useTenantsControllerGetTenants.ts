import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { TenantsControllerGetTenantsQueryResponse } from '../../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { tenantsControllerGetTenants } from '../../axios/TenantsService/tenantsControllerGetTenants.ts'

export const tenantsControllerGetTenantsQueryKey = () => [{ url: '/api/tenants' }] as const

export type TenantsControllerGetTenantsQueryKey = ReturnType<typeof tenantsControllerGetTenantsQueryKey>

export function tenantsControllerGetTenantsQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = tenantsControllerGetTenantsQueryKey()
  return queryOptions<
    ResponseConfig<TenantsControllerGetTenantsQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<TenantsControllerGetTenantsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return tenantsControllerGetTenants(config)
    },
  })
}

/**
 * {@link /api/tenants}
 */
export function useTenantsControllerGetTenants<
  TData = ResponseConfig<TenantsControllerGetTenantsQueryResponse>,
  TQueryData = ResponseConfig<TenantsControllerGetTenantsQueryResponse>,
  TQueryKey extends QueryKey = TenantsControllerGetTenantsQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<TenantsControllerGetTenantsQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? tenantsControllerGetTenantsQueryKey()

  const query = useQuery(
    {
      ...tenantsControllerGetTenantsQueryOptions(config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
