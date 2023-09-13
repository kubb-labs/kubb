import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '@kubb/swagger-client/client'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'

export function findPetsByStatusQueryOptions<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  params?: FindPetsByStatusQueryParams,
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
      })
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export function useFindPetsByStatus<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  params?: FindPetsByStatusQueryParams,
  options?: { query?: SWRConfiguration<TData, TError> },
): SWRResponse<TData, TError> {
  const { query: queryOptions } = options ?? {}
  const query = useSWR<TData, TError, string>(`/pet/findByStatus`, {
    ...findPetsByStatusQueryOptions<TData, TError>(params),
    ...queryOptions,
  })
  return query
}
