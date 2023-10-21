import client from '@kubb/swagger-client/client'
import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../models/LoginUser'

export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,

        params,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUser<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/user/login` : null
  const query = useSWR<TData, TError, string | null>(url, {
    ...loginUserQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })

  return query
}
