import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../../../models/ts/userController/GetUserByName'

export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then(res => res)
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByName<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options?: {
    query?: SWRConfiguration<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = shouldFetch ? `/user/${username}` : null
  const query = useSWR<ResponseConfig<TData>, TError, string | null>(url, {
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  })
  return query
}
