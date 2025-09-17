import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { PartsControllerGetPartQueryResponse, PartsControllerGetPartPathParams } from '../../../models/ts/partsController/PartsControllerGetPart.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { partsControllerGetPart } from '../../axios/PartsService/partsControllerGetPart.ts'

export const partsControllerGetPartQueryKey = ({ urn }: { urn: PartsControllerGetPartPathParams['urn'] }) =>
  [{ url: '/api/parts/:urn', params: { urn: urn } }] as const

export type PartsControllerGetPartQueryKey = ReturnType<typeof partsControllerGetPartQueryKey>

export function partsControllerGetPartQueryOptions(
  { urn }: { urn: PartsControllerGetPartPathParams['urn'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = partsControllerGetPartQueryKey({ urn })
  return queryOptions<
    ResponseConfig<PartsControllerGetPartQueryResponse>,
    ResponseErrorConfig<Error>,
    ResponseConfig<PartsControllerGetPartQueryResponse>,
    typeof queryKey
  >({
    enabled: !!urn,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return partsControllerGetPart({ urn }, config)
    },
  })
}

/**
 * {@link /api/parts/:urn}
 */
export function usePartsControllerGetPart<
  TData = ResponseConfig<PartsControllerGetPartQueryResponse>,
  TQueryData = ResponseConfig<PartsControllerGetPartQueryResponse>,
  TQueryKey extends QueryKey = PartsControllerGetPartQueryKey,
>(
  { urn }: { urn: PartsControllerGetPartPathParams['urn'] },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<PartsControllerGetPartQueryResponse>, ResponseErrorConfig<Error>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? partsControllerGetPartQueryKey({ urn })

  const query = useQuery(
    {
      ...partsControllerGetPartQueryOptions({ urn }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<Error>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
