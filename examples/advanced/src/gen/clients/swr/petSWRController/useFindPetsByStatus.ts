import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import type { Key, SWRConfiguration } from 'swr'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({
    method: 'get',
    url: '/pet/findByStatus',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return findPetsByStatusQueryResponseSchema.parse(res.data)
}

export function findPetsByStatusQueryOptions(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return findPetsByStatus(params, config)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatus(
  params?: FindPetsByStatusQueryParams,
  options: {
    query?: SWRConfiguration<FindPetsByStatusQueryResponse, FindPetsByStatus400>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/pet/findByStatus', params] as const
  return useSWR<FindPetsByStatusQueryResponse, FindPetsByStatus400, Key>(shouldFetch ? swrKey : null, {
    ...findPetsByStatusQueryOptions(params, config),
    ...queryOptions,
  })
}
