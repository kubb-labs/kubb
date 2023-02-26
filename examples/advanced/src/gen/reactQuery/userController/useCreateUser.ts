import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { CreateUserRequest, CreateUserResponse } from '../../models/ts/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export const useCreateUser = <TData = CreateUserResponse, TVariables = CreateUserRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/user`,
        data,
      })
    },
    ...mutationOptions,
  })
}
