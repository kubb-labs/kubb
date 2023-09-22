import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type { LoginUserQueryResponse, LoginuserQueryparams, Loginuser400 } from '../../../models/ts/userController/LoginUser'

export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = Loginuser400>(
  params?: LoginuserQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,

        params,

        ...options,
      })
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginuser<TData = LoginUserQueryResponse, TError = Loginuser400>(
  params?: LoginuserQueryparams,
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
