import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  TenantsControllerGetTenantQueryResponse,
  TenantsControllerGetTenantPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { tenantsControllerGetTenant } from '../../axios/TenantsService/tenantsControllerGetTenant.ts'

export const tenantsControllerGetTenantQueryKey = ({ id }: { id: TenantsControllerGetTenantPathParams['id'] }) =>
  [{ url: '/api/tenants/:id', params: { id: id } }] as const

export type TenantsControllerGetTenantQueryKey = ReturnType<typeof tenantsControllerGetTenantQueryKey>

export function tenantsControllerGetTenantQueryOptions(
  { id }: { id: TenantsControllerGetTenantPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = tenantsControllerGetTenantQueryKey({ id })
  return queryOptions<
    ResponseConfig<TenantsControllerGetTenantQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<TenantsControllerGetTenantQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return tenantsControllerGetTenant({ id }, config)
    },
  })
}

/**
 * {@link /api/tenants/:id}
 */
export function useTenantsControllerGetTenant<
  TData = ResponseConfig<TenantsControllerGetTenantQueryResponse>,
  TQueryData = ResponseConfig<TenantsControllerGetTenantQueryResponse>,
  TQueryKey extends QueryKey = TenantsControllerGetTenantQueryKey,
>(
  { id }: { id: TenantsControllerGetTenantPathParams['id'] },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<TenantsControllerGetTenantQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? tenantsControllerGetTenantQueryKey({ id })

  const query = useQuery(
    {
      ...tenantsControllerGetTenantQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
