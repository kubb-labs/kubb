import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type {
  WeldPacksControllerGetWeldPackQueryResponse,
  WeldPacksControllerGetWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { weldPacksControllerGetWeldPack } from '../../axios/WeldPacksService/weldPacksControllerGetWeldPack.ts'

export const weldPacksControllerGetWeldPackQueryKey = ({ id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] }) =>
  [{ url: '/api/weldpacks/:id', params: { id: id } }] as const

export type WeldPacksControllerGetWeldPackQueryKey = ReturnType<typeof weldPacksControllerGetWeldPackQueryKey>

export function weldPacksControllerGetWeldPackQueryOptions(
  { id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = weldPacksControllerGetWeldPackQueryKey({ id })
  return queryOptions<
    ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return weldPacksControllerGetWeldPack({ id }, config)
    },
  })
}

/**
 * {@link /api/weldpacks/:id}
 */
export function useWeldPacksControllerGetWeldPack<
  TData = ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>,
  TQueryData = ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>,
  TQueryKey extends QueryKey = WeldPacksControllerGetWeldPackQueryKey,
>(
  { id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<WeldPacksControllerGetWeldPackQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? weldPacksControllerGetWeldPackQueryKey({ id })

  const query = useQuery(
    {
      ...weldPacksControllerGetWeldPackQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
