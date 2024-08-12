import useSWR from 'swr'
import client from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../models/FindPetsByTags'

type FindPetsByTagsClient = typeof client<FindPetsByTagsQueryResponse, FindPetsByTags400, never>
type FindPetsByTags = {
  data: FindPetsByTagsQueryResponse
  error: FindPetsByTags400
  request: never
  pathParams: never
  queryParams: FindPetsByTagsQueryParams
  headerParams: never
  response: FindPetsByTagsQueryResponse
  client: {
    parameters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export function findPetsByTagsQueryOptions<TData = FindPetsByTags['response']>(
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, FindPetsByTags['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, FindPetsByTags['error']>({ method: 'get', url: '/pet/findByTags', params, ...options })
      return res.data
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags<TData = FindPetsByTags['response']>(
  params?: FindPetsByTags['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, FindPetsByTags['error']>
    client?: FindPetsByTags['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, FindPetsByTags['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/pet/findByTags'
  const query = useSWR<TData, FindPetsByTags['error'], [typeof url, typeof params] | null>(shouldFetch ? [url, params] : null, {
    ...findPetsByTagsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
