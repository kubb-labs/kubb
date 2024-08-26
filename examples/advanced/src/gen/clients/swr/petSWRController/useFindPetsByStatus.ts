import type { SWRConfiguration, SWRResponse } from 'swr'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema'
import useSWR from 'swr'
import client from '../../../../swr-client.ts'

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
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['parameters'] = {},
): SWRConfiguration<TData, FindPetsByStatus['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, FindPetsByStatus['error']>({
        method: 'get',
        url: '/pet/findByStatus',
        params,
        ...options,
      })
      return { ...res, data: findPetsByStatusQueryResponseSchema.parse(res.data) }
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
  const query = useSWR<TData, FindPetsByStatus['error'], [typeof url, typeof params] | null>(shouldFetch ? [url, params] : null, {
    ...findPetsByStatusQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
