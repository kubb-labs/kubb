import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../swr-client.ts'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { FindPetsByStatus400, FindPetsByStatusQueryParams, FindPetsByStatusQueryResponse } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

type FindPetsByStatusClient = typeof client<FindPetsByStatusQueryResponse, FindPetsByStatus400, never>

type FindPetsByStatus = {
  data: FindPetsByStatusQueryResponse
  error: FindPetsByStatus400
  request: never
  pathParams: never
  queryParams: FindPetsByStatusQueryParams
  headerParams: never
  response: Awaited<ReturnType<FindPetsByStatusClient>>
  client: {
    parameters: Partial<Parameters<FindPetsByStatusClient>[0]>
    return: Awaited<ReturnType<FindPetsByStatusClient>>
  }
}

export function findPetsByStatusQueryOptions<TData = FindPetsByStatus['response']>(
  params?: FindPetsByStatusQueryParams,
  config: Partial<RequestConfig> = {},
): SWRConfiguration<TData, FindPetsByStatus['error']> {
  return {
    fetcher: async () => {
      const res = await client<FindPetsByStatusQueryResponse>({
        method: 'get',
        url: '/pet/findByStatus',
        baseURL: 'https://petstore3.swagger.io/api/v3',
        params,
        ...config,
      })
      return findPetsByStatusQueryResponseSchema.parse(res)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatus<TData = FindPetsByStatus['response']>(
  params?: FindPetsByStatus['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, FindPetsByStatus['error']>
    client?: FindPetsByStatus['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, FindPetsByStatus['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/pet/findByStatus'
  const query = useSWR<TData, FindPetsByStatus['error'], typeof url | null>(shouldFetch ? url : null, {
    ...findPetsByStatusQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
