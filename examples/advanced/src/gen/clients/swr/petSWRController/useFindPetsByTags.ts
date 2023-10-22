import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags'

export function findPetsByTagsQueryOptions<
  TData = FindPetsByTagsQueryResponse,
  TError = FindPetsByTags400,
>(
  params?: FindPetsByTagsQueryParams,
  headers?: FindPetsByTagsHeaderParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,

        params,
        headers: { ...headers, ...options.headers },
        ...options,
      }).then(res => res)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */

export function useFindPetsByTags<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  headers?: FindPetsByTagsHeaderParams,
  options?: {
    query?: SWRConfiguration<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/pet/findByTags` : null
  const query = useSWR<ResponseConfig<TData>, TError, string | null>(url, {
    ...findPetsByTagsQueryOptions<TData, TError>(params, headers, clientOptions),
    ...queryOptions,
  })

  return query
}
