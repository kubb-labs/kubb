import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type { ResponseConfig } from '../../../../client'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser'

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
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}

  const query = useSWR<TData, TError, string>(`/user/login`, {
    ...loginUserQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })

  return query
}
