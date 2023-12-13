import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus'

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
    paramaters: Partial<Parameters<FindPetsByStatusClient>[0]>
    return: Awaited<ReturnType<FindPetsByStatusClient>>
  }
}
export function findPetsByStatusQueryOptions<TData extends FindPetsByStatus['response'] = FindPetsByStatus['response'], TError = FindPetsByStatus['error']>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['paramaters'] = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: async () => {
      const res = await client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      })
      return res
    },
  }
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export function useFindPetsByStatus<TData extends FindPetsByStatus['response'] = FindPetsByStatus['response'], TError = FindPetsByStatus['error']>(
  params?: FindPetsByStatus['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: FindPetsByStatus['client']['paramaters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByStatus` as const
  const query = useSWR<
    TData,
    TError,
    [
      typeof url,
      typeof params,
    ] | null
  >(shouldFetch ? [url, params] : null, {
    ...findPetsByStatusQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })
  return query
}
