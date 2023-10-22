import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus'

export function findPetsByStatusQueryOptions<
  TData = FindPetsByStatusQueryResponse,
  TError = FindPetsByStatus400,
>(
  params?: FindPetsByStatusQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,

        params,

        ...options,
      }).then(res => res)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindPetsByStatus<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(params?: FindPetsByStatusQueryParams, options?: {
  query?: SWRConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/pet/findByStatus` : null
  const query = useSWR<ResponseConfig<TData>, TError, string | null>(url, {
    ...findPetsByStatusQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })

  return query
}
