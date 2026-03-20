import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryClient, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKey = ({ stepId }: { stepId: FindPetsByStatusPathParams['stepId'] }) =>
  [{ url: '/pet/findByStatus/:step_id', params: { stepId: stepId } }] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(
  { stepId }: { stepId: FindPetsByStatusPathParams['stepId'] },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const queryKey = findPetsByStatusQueryKey({ stepId })
  return queryOptions<
    ResponseConfig<FindPetsByStatusQueryResponse>,
    ResponseErrorConfig<FindPetsByStatus400>,
    ResponseConfig<FindPetsByStatusQueryResponse>,
    typeof queryKey
  >({
    enabled: !!stepId,
    queryKey,
    queryFn: async ({ signal }) => {
      return findPetsByStatus({ stepId: stepId }, { ...config, signal: config.signal ?? signal })
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatus<
  TData = ResponseConfig<FindPetsByStatusQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByStatusQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  { stepId }: { stepId: FindPetsByStatusPathParams['stepId'] },
  options: {
    query?: Partial<
      QueryObserverOptions<ResponseConfig<FindPetsByStatusQueryResponse>, ResponseErrorConfig<FindPetsByStatus400>, TData, TQueryData, TQueryKey>
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: Client }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...resolvedOptions } = queryConfig
  const queryKey = resolvedOptions?.queryKey ?? findPetsByStatusQueryKey({ stepId })

  const query = useQuery(
    {
      ...findPetsByStatusQueryOptions({ stepId }, config),
      ...resolvedOptions,
      queryKey,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
