import client from '@kubb/plugin-client/client'
import useSWR from 'swr'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'

type ClientDataReturnTypeFullClient = typeof client<ClientDataReturnTypeFull, ClientDataReturnTypeFull, never>

type ClientDataReturnTypeFull = {
  data: ClientDataReturnTypeFull
  error: ClientDataReturnTypeFull
  request: never
  pathParams: never
  queryParams: ClientDataReturnTypeFull
  headerParams: never
  response: Awaited<ReturnType<ClientDataReturnTypeFullClient>>
  client: {
    parameters: Partial<Parameters<ClientDataReturnTypeFullClient>[0]>
    return: Awaited<ReturnType<ClientDataReturnTypeFullClient>>
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function clientDataReturnTypeFull<TData = ClientDataReturnTypeFull['response']>(
  params?: ClientDataReturnTypeFull['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, ClientDataReturnTypeFull['error']>
    client?: ClientDataReturnTypeFull['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, ClientDataReturnTypeFull['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags`
  const query = useSWR<TData, ClientDataReturnTypeFull['error'], typeof url | null>(shouldFetch ? url : null, {
    ...findPetsByTagsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}

export function findPetsByTagsQueryOptions<TData = ClientDataReturnTypeFull['response']>(
  params?: ClientDataReturnTypeFull,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, ClientDataReturnTypeFull['error']> {
  return {
    fetcher: async () => {
      return clientDataReturnTypeFull(params, config)
    },
  }
}
