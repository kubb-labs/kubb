import useSWR from 'swr'
import client from '../../../../swr-client.ts'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../../../models/ts/userController/GetUserByName'

type GetUserByNameClient = typeof client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, never>
type GetUserByName = {
  data: GetUserByNameQueryResponse
  error: GetUserByName400 | GetUserByName404
  request: never
  pathParams: GetUserByNamePathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<GetUserByNameClient>>
  client: {
    parameters: Partial<Parameters<GetUserByNameClient>[0]>
    return: Awaited<ReturnType<GetUserByNameClient>>
  }
}
export function getUserByNameQueryOptions<TData = GetUserByName['response']>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['parameters'] = {},
): SWRConfiguration<TData, GetUserByName['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, GetUserByName['error']>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
export function useGetUserByName<TData = GetUserByName['response']>(username: GetUserByNamePathParams['username'], options?: {
  query?: SWRConfiguration<TData, GetUserByName['error']>
  client?: GetUserByName['client']['parameters']
  shouldFetch?: boolean
}): SWRResponse<TData, GetUserByName['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/${username}`
  const query = useSWR<TData, GetUserByName['error'], typeof url | null>(shouldFetch ? url : null, {
    ...getUserByNameQueryOptions<TData>(username, clientOptions),
    ...queryOptions,
  })
  return query
}
