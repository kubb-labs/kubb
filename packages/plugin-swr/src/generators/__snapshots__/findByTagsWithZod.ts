import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type FindByTagsWithZodClient = typeof client<FindByTagsWithZod, FindByTagsWithZod, never>

type FindByTagsWithZod = {
  data: FindByTagsWithZod
  error: FindByTagsWithZod
  request: never
  pathParams: never
  queryParams: FindByTagsWithZod
  headerParams: never
  response: FindByTagsWithZod
  client: {
    parameters: Partial<Parameters<FindByTagsWithZodClient>[0]>
    return: Awaited<ReturnType<FindByTagsWithZodClient>>
  }
}

export function findPetsByTagsQueryOptions<TData = FindByTagsWithZod['response']>(
  params?: FindByTagsWithZod,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, FindByTagsWithZod['error']> {
  return {
    fetcher: async () => {
      const res = await client<FindByTagsWithZod>({ method: 'get', url: `/pet/findByTags`, params, ...config })
      return { ...res, data: findByTagsWithZod.parse(res.data) }
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findByTagsWithZod<TData = FindByTagsWithZod['response']>(
  params?: FindByTagsWithZod['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, FindByTagsWithZod['error']>
    client?: FindByTagsWithZod['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, FindByTagsWithZod['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags`
  const query = useSWR<TData, FindByTagsWithZod['error'], typeof url | null>(shouldFetch ? url : null, {
    ...findPetsByTagsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
