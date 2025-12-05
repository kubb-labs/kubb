import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type {
  FindPetsByTags400,
  FindPetsByTagsHeaderParams,
  FindPetsByTagsQueryParams,
  FindPetsByTagsQueryResponse,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { findPetsByTags } from '../../axios/petService/findPetsByTags.ts'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions(
  { headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = findPetsByTagsQueryKey(params)
  return queryOptions<
    ResponseConfig<FindPetsByTagsQueryResponse>,
    ResponseErrorConfig<FindPetsByTags400>,
    ResponseConfig<FindPetsByTagsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return findPetsByTags({ headers, params }, config)
    },
  })
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags<
  TData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryData = ResponseConfig<FindPetsByTagsQueryResponse>,
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(
  { headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams },
  options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<FindPetsByTagsQueryResponse>, ResponseErrorConfig<FindPetsByTags400>, TData, TQueryData, TQueryKey>> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery(
    {
      ...findPetsByTagsQueryOptions({ headers, params }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<FindPetsByTags400>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
