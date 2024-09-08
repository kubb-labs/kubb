import client from '@kubb/plugin-client/client'
import useSWR from 'custom-swr'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration, SWRResponse } from 'custom-swr'

type PostAsQueryClient = typeof client<PostAsQuery, PostAsQuery, never>

type PostAsQuery = {
  data: PostAsQuery
  error: PostAsQuery
  request: never
  pathParams: PostAsQuery
  queryParams: PostAsQuery
  headerParams: never
  response: PostAsQuery
  client: {
    parameters: Partial<Parameters<PostAsQueryClient>[0]>
    return: Awaited<ReturnType<PostAsQueryClient>>
  }
}

export function updatePetWithFormQueryOptions<TData = PostAsQuery['response']>(
  petId: PostAsQuery['petId'],
  params?: PostAsQuery,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, PostAsQuery['error']> {
  return {
    fetcher: async () => {
      const res = await client<PostAsQuery>({ method: 'post', url: `/pet/${petId}`, params, ...config })
      return res.data
    },
  }
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function postAsQuery<TData = PostAsQuery['response']>(
  petId: PostAsQuery['petId'],
  params?: PostAsQuery['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, PostAsQuery['error']>
    client?: PostAsQuery['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, PostAsQuery['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}`
  const query = useSWR<TData, PostAsQuery['error'], typeof url | null>(shouldFetch ? url : null, {
    ...updatePetWithFormQueryOptions<TData>(petId, params, clientOptions),
    ...queryOptions,
  })
  return query
}
