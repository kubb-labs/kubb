import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags'

type FindPetsByTagsClient = typeof client<FindPetsByTagsQueryResponse, FindPetsByTags400, never>
type FindPetsByTags = {
  data: FindPetsByTagsQueryResponse
  error: FindPetsByTags400
  request: never
  pathParams: never
  queryParams: FindPetsByTagsQueryParams
  headerParams: FindPetsByTagsHeaderParams
  response: Awaited<ReturnType<FindPetsByTagsClient>>
  client: {
    paramaters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export function findPetsByTagsQueryOptions<TData extends FindPetsByTags['response'] = FindPetsByTags['response'], TError = FindPetsByTags['error']>(
  params?: FindPetsByTags['queryParams'],
  headers?: FindPetsByTags['headerParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: async () => {
      const res = await client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        headers: { ...headers, ...options.headers },
        ...options,
      })
      return res
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export function useFindPetsByTags<TData extends FindPetsByTags['response'] = FindPetsByTags['response'], TError = FindPetsByTags['error']>(
  params?: FindPetsByTags['queryParams'],
  headers?: FindPetsByTags['headerParams'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: FindPetsByTags['client']['paramaters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags` as const
  const query = useSWR<
    TData,
    TError,
    [
      typeof url,
      typeof params,
    ] | null
  >(shouldFetch ? [url, params] : null, {
    ...findPetsByTagsQueryOptions<TData, TError>(params, headers, clientOptions),
    ...queryOptions,
  })
  return query
}
