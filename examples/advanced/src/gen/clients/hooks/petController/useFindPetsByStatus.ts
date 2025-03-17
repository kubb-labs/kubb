import type client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKey = ({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }) =>
  [{ url: '/pet/findByStatus/:step_id', params: { step_id: step_id } }] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

export function findPetsByStatusQueryOptions(
  { step_id }: { step_id: FindPetsByStatusPathParams['step_id'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const queryKey = findPetsByStatusQueryKey({ step_id })
  return queryOptions<
    ResponseConfig<FindPetsByStatusQueryResponse>,
    ResponseErrorConfig<FindPetsByStatus400>,
    ResponseConfig<FindPetsByStatusQueryResponse>,
    typeof queryKey
  >({
    enabled: !!step_id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByStatus({ step_id }, config)
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
  { step_id }: { step_id: FindPetsByStatusPathParams['step_id'] },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<FindPetsByStatusQueryResponse>, ResponseErrorConfig<FindPetsByStatus400>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey({ step_id })

  const query = useQuery({
    ...(findPetsByStatusQueryOptions({ step_id }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByStatus400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
