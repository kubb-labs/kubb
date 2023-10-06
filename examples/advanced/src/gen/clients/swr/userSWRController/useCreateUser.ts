import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '../../../../client'
import type { ResponseConfig } from '../../../../client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

export function useCreateUser<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(options?: {
  mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string, TVariables>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): SWRMutationResponse<ResponseConfig<TData>, TError, string, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<ResponseConfig<TData>, TError, string, TVariables>(
    `/user`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
