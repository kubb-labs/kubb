import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'swr'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const findPetsByStatusQueryKey = (params?: FindPetsByStatusQueryParams) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const

export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: '/pet/findByStatus',
    params,
    ...requestConfig,
  })
  return res.data
}

export function findPetsByStatusQueryOptions(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  return {
    fetcher: async () => {
      return findPetsByStatus(params, config)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export function useFindPetsByStatus(
  params?: FindPetsByStatusQueryParams,
  options: {
    query?: Parameters<typeof useSWR<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryKey | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = findPetsByStatusQueryKey(params)

  return useSWR<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryKey | null>(shouldFetch ? queryKey : null, {
    ...findPetsByStatusQueryOptions(params, config),
    ...queryOptions,
  })
}
