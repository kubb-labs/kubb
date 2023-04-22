import useSWRMutation from 'swr/mutation'

import client from '../../../../client'

import type { SWRMutationConfiguration } from 'swr/mutation'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUser<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(options?: {
  mutation?: SWRMutationConfiguration<TData, TError, TVariables, string>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/user`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,
      })
    },
    mutationOptions
  )
}
