import client from '@kubb/swagger-client/client'
import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetUserByName400, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../models/GetUserByName'

export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByName<TData = GetUserByNameQueryResponse, TError = GetUserByName400>(
  username: GetUserByNamePathParams['username'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/user/${username}` : null
  const query = useSWR<TData, TError, string | null>(url, {
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  })

  return query
}
