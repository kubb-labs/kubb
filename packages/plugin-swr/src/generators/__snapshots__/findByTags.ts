import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type FindByTagsClient = typeof client<FindByTags, FindByTags, never>

type FindByTags = {
  data: FindByTags
  error: FindByTags
  request: never
  pathParams: never
  queryParams: FindByTags
  headerParams: never
  response: FindByTags
  client: {
    parameters: Partial<Parameters<FindByTagsClient>[0]>
    return: Awaited<ReturnType<FindByTagsClient>>
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findByTags<TData = FindByTags['response']>(
  params?: FindByTags['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, FindByTags['error']>
    client?: FindByTags['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, FindByTags['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags`
  const query = useSWR<TData, FindByTags['error'], typeof url | null>(shouldFetch ? url : null, {
    ...findPetsByTagsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}

export function findPetsByTagsQueryOptions<TData = FindByTags['response']>(
  params?: FindByTags,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, FindByTags['error']> {
  return {
    fetcher: async () => {
      return findByTags(params, config)
    },
  }
}
