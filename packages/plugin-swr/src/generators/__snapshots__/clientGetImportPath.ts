import client from 'axios'
import useSWR from 'swr'
import type { RequestConfig } from 'axios'
import type { SWRConfiguration, SWRResponse } from 'swr'

type ClientGetImportPathClient = typeof client<ClientGetImportPath, ClientGetImportPath, never>

type ClientGetImportPath = {
  data: ClientGetImportPath
  error: ClientGetImportPath
  request: never
  pathParams: never
  queryParams: ClientGetImportPath
  headerParams: never
  response: ClientGetImportPath
  client: {
    parameters: Partial<Parameters<ClientGetImportPathClient>[0]>
    return: Awaited<ReturnType<ClientGetImportPathClient>>
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function clientGetImportPath<TData = ClientGetImportPath['response']>(
  params?: ClientGetImportPath['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, ClientGetImportPath['error']>
    client?: ClientGetImportPath['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, ClientGetImportPath['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags`
  const query = useSWR<TData, ClientGetImportPath['error'], typeof url | null>(shouldFetch ? url : null, {
    ...findPetsByTagsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}

export function findPetsByTagsQueryOptions<TData = ClientGetImportPath['response']>(
  params?: ClientGetImportPath,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, ClientGetImportPath['error']> {
  return {
    fetcher: async () => {
      return clientGetImportPath(params, config)
    },
  }
}
