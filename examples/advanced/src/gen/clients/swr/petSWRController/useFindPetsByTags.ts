import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import type { Key, SWRConfiguration } from 'swr'
import { findPetsByTagsQueryResponseSchema } from '../../../zod/petController/findPetsByTagsSchema.ts'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({
    method: 'get',
    url: '/pet/findByTags',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return findPetsByTagsQueryResponseSchema.parse(res.data)
}

export function findPetsByTagsQueryOptions(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return findPetsByTags(headers, params, config)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: SWRConfiguration<FindPetsByTagsQueryResponse, FindPetsByTags400>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/pet/findByTags', params] as const
  return useSWR<FindPetsByTagsQueryResponse, FindPetsByTags400, Key>(shouldFetch ? swrKey : null, {
    ...findPetsByTagsQueryOptions(headers, params, config),
    ...queryOptions,
  })
}
