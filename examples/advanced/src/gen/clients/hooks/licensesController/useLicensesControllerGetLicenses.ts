import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { LicensesControllerGetLicensesQueryResponse } from '../../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { licensesControllerGetLicenses } from '../../axios/LicensesService/licensesControllerGetLicenses.ts'

export const licensesControllerGetLicensesQueryKey = () => [{ url: '/api/licenses' }] as const

export type LicensesControllerGetLicensesQueryKey = ReturnType<typeof licensesControllerGetLicensesQueryKey>

export function licensesControllerGetLicensesQueryOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = licensesControllerGetLicensesQueryKey()
  return queryOptions<
    ResponseConfig<LicensesControllerGetLicensesQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<LicensesControllerGetLicensesQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return licensesControllerGetLicenses(config)
    },
  })
}

/**
 * {@link /api/licenses}
 */
export function useLicensesControllerGetLicenses<
  TData = ResponseConfig<LicensesControllerGetLicensesQueryResponse>,
  TQueryData = ResponseConfig<LicensesControllerGetLicensesQueryResponse>,
  TQueryKey extends QueryKey = LicensesControllerGetLicensesQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<LicensesControllerGetLicensesQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? licensesControllerGetLicensesQueryKey()

  const query = useQuery(
    {
      ...licensesControllerGetLicensesQueryOptions(config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
