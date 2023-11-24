import useSWR from 'swr'
import client from '@kubb/swagger-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'

export function findPetsByTagsQueryOptions<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      }).then((res) => res.data)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export function useFindPetsByTags<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = shouldFetch ? `/pet/findByTags` : null
  const query = useSWR<TData, TError, string | null>(url, {
    ...findPetsByTagsQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
