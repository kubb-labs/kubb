import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../swr-client.ts'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser'

export function loginUserQueryOptions<
  TData = LoginUserQueryResponse,
  TError = LoginUser400,
>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<ResponseConfig<TData>, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,

        params,

        ...options,
      }).then(res => res)
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUser<TData = LoginUserQueryResponse, TError = LoginUser400>(params?: LoginUserQueryParams, options?: {
  query?: SWRConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  shouldFetch?: boolean
}): SWRResponse<ResponseConfig<TData>, TError> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/user/login` : null
  const query = useSWR<ResponseConfig<TData>, TError, string | null>(url, {
    ...loginUserQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })

  return query
}
