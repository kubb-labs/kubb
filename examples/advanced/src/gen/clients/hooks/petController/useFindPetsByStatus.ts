import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook.ts'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

export const findPetsByStatusQueryKey = ({
  stepId,
}: {
  stepId: FindPetsByStatusPathParams['step_id']
}) => [{ url: '/pet/findByStatus/:step_id', params: { stepId: stepId } }] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus/:step_id
 */
async function findPetsByStatus(
  {
    stepId,
  }: {
    stepId: FindPetsByStatusPathParams['step_id']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({ method: 'GET', url: `/pet/findByStatus/${stepId}`, ...config })
  return { ...res, data: findPetsByStatusQueryResponseSchema.parse(res.data) }
}

export function findPetsByStatusQueryOptions(
  {
    stepId,
  }: {
    stepId: FindPetsByStatusPathParams['step_id']
  },
  config: Partial<RequestConfig> = {},
) {
  const queryKey = findPetsByStatusQueryKey({ stepId })
  return queryOptions({
    enabled: !!stepId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByStatus({ stepId }, config)
    },
  })
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus/:step_id
 */
export function useFindPetsByStatus<
  TData = ResponseConfig<FindPetsByStatusQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByStatusQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  {
    stepId,
  }: {
    stepId: FindPetsByStatusPathParams['step_id']
  },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<FindPetsByStatusQueryResponse>, FindPetsByStatus400, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey({ stepId })
  const query = useQuery({
    ...(findPetsByStatusQueryOptions({ stepId }, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, FindPetsByStatus400> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
