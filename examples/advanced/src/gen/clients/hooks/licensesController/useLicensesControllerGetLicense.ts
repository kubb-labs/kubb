import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  LicensesControllerGetLicenseQueryResponse,
  LicensesControllerGetLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { licensesControllerGetLicense } from '../../axios/LicensesService/licensesControllerGetLicense.ts'

export const licensesControllerGetLicenseQueryKey = ({ id }: { id: LicensesControllerGetLicensePathParams['id'] }) =>
  [{ url: '/api/licenses/:id', params: { id: id } }] as const

export type LicensesControllerGetLicenseQueryKey = ReturnType<typeof licensesControllerGetLicenseQueryKey>

export function licensesControllerGetLicenseQueryOptions(
  { id }: { id: LicensesControllerGetLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = licensesControllerGetLicenseQueryKey({ id })
  return queryOptions<
    ResponseConfig<LicensesControllerGetLicenseQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<LicensesControllerGetLicenseQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return licensesControllerGetLicense({ id }, config)
    },
  })
}

/**
 * {@link /api/licenses/:id}
 */
export function useLicensesControllerGetLicense<
  TData = ResponseConfig<LicensesControllerGetLicenseQueryResponse>,
  TQueryData = ResponseConfig<LicensesControllerGetLicenseQueryResponse>,
  TQueryKey extends QueryKey = LicensesControllerGetLicenseQueryKey,
>(
  { id }: { id: LicensesControllerGetLicensePathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<LicensesControllerGetLicenseQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? licensesControllerGetLicenseQueryKey({ id })

  const query = useQuery(
    {
      ...licensesControllerGetLicenseQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
