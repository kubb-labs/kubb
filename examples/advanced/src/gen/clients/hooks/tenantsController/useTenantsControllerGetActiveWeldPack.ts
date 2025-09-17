import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  TenantsControllerGetActiveWeldPackQueryResponse,
  TenantsControllerGetActiveWeldPackPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { tenantsControllerGetActiveWeldPack } from '../../axios/TenantsService/tenantsControllerGetActiveWeldPack.ts'

export const tenantsControllerGetActiveWeldPackQueryKey = ({ id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] }) =>
  [{ url: '/api/tenants/:id/active-weldpack', params: { id: id } }] as const

export type TenantsControllerGetActiveWeldPackQueryKey = ReturnType<typeof tenantsControllerGetActiveWeldPackQueryKey>

export function tenantsControllerGetActiveWeldPackQueryOptions(
  { id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = tenantsControllerGetActiveWeldPackQueryKey({ id })
  return queryOptions<
    ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return tenantsControllerGetActiveWeldPack({ id }, config)
    },
  })
}

/**
 * {@link /api/tenants/:id/active-weldpack}
 */
export function useTenantsControllerGetActiveWeldPack<
  TData = ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>,
  TQueryData = ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>,
  TQueryKey extends QueryKey = TenantsControllerGetActiveWeldPackQueryKey,
>(
  { id }: { id: TenantsControllerGetActiveWeldPackPathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<TenantsControllerGetActiveWeldPackQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? tenantsControllerGetActiveWeldPackQueryKey({ id })

  const query = useQuery(
    {
      ...tenantsControllerGetActiveWeldPackQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
