import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  TenantsControllerGetActiveLicenseQueryResponse,
  TenantsControllerGetActiveLicensePathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { tenantsControllerGetActiveLicense } from '../../axios/TenantsService/tenantsControllerGetActiveLicense.ts'

export const tenantsControllerGetActiveLicenseQueryKey = ({ id }: { id: TenantsControllerGetActiveLicensePathParams['id'] }) =>
  [{ url: '/api/tenants/:id/active-license', params: { id: id } }] as const

export type TenantsControllerGetActiveLicenseQueryKey = ReturnType<typeof tenantsControllerGetActiveLicenseQueryKey>

export function tenantsControllerGetActiveLicenseQueryOptions(
  { id }: { id: TenantsControllerGetActiveLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = tenantsControllerGetActiveLicenseQueryKey({ id })
  return queryOptions<
    ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return tenantsControllerGetActiveLicense({ id }, config)
    },
  })
}

/**
 * {@link /api/tenants/:id/active-license}
 */
export function useTenantsControllerGetActiveLicense<
  TData = ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>,
  TQueryData = ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>,
  TQueryKey extends QueryKey = TenantsControllerGetActiveLicenseQueryKey,
>(
  { id }: { id: TenantsControllerGetActiveLicensePathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<TenantsControllerGetActiveLicenseQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? tenantsControllerGetActiveLicenseQueryKey({ id })

  const query = useQuery(
    {
      ...tenantsControllerGetActiveLicenseQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
