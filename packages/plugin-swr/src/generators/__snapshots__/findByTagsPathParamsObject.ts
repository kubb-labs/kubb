import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type FindByTagsPathParamsObjectClient = typeof client<FindByTagsPathParamsObject, FindByTagsPathParamsObject, never>

type FindByTagsPathParamsObject = {
  data: FindByTagsPathParamsObject
  error: FindByTagsPathParamsObject
  request: never
  pathParams: never
  queryParams: FindByTagsPathParamsObject
  headerParams: never
  response: FindByTagsPathParamsObject
  client: {
    parameters: Partial<Parameters<FindByTagsPathParamsObjectClient>[0]>
    return: Awaited<ReturnType<FindByTagsPathParamsObjectClient>>
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findByTagsPathParamsObject<TData = FindByTagsPathParamsObject['response']>(
  params?: FindByTagsPathParamsObject['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, FindByTagsPathParamsObject['error']>
    client?: FindByTagsPathParamsObject['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, FindByTagsPathParamsObject['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags`
  const query = useSWR<TData, FindByTagsPathParamsObject['error'], typeof url | null>(shouldFetch ? url : null, {
    ...findPetsByTagsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}

export function findPetsByTagsQueryOptions<TData = FindByTagsPathParamsObject['response']>(
  params?: FindByTagsPathParamsObject,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, FindByTagsPathParamsObject['error']> {
  return {
    fetcher: async () => {
      return findByTagsPathParamsObject(params, config)
    },
  }
}
