import useSWR from 'swr'
import client from '@kubb/swagger-client/client'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/GetUserByName'

type GetUserByNameClient = typeof client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, never>
type GetUserByName = {
  data: GetUserByNameQueryResponse
  error: GetUserByName400 | GetUserByName404
  request: never
  pathParams: GetUserByNamePathParams
  queryParams: never
  headerParams: never
  response: GetUserByNameQueryResponse
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
      return res.data
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByName<TData extends GetUserByName['response'] = GetUserByName['response'], TError = GetUserByName['error']>(
  username: GetUserByNamePathParams['username'],
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: GetUserByName['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/${username}` as const
  const query = useSWR<TData, TError, typeof url | null>(shouldFetch ? url : null, {
    ...getUserByNameQueryOptions<TData>(username, clientOptions),
    ...queryOptions,
  })
  return query
}
