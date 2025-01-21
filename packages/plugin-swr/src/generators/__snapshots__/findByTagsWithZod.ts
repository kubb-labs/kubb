import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const

export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>

export function findPetsByTagsQueryOptions({ params }: { params?: FindPetsByTagsQueryParams }, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return findPetsByTags({ params }, config)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function useFindPetsByTags(
  { params }: { params?: FindPetsByTagsQueryParams },
  options: {
    query?: Parameters<typeof useSWR<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, FindPetsByTagsQueryKey | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = findPetsByTagsQueryKey(params)

  return useSWR<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, FindPetsByTagsQueryKey | null>(shouldFetch ? queryKey : null, {
    ...findPetsByTagsQueryOptions({ params }, config),
    ...queryOptions,
  })
}
