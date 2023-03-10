import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { DeleteUserRequest, DeleteUserResponse, DeleteUserPathParams } from '../../models/ts/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/{username}
 * @deprecated
 */
export function useDeleteUser<TData = DeleteUserResponse, TVariables = DeleteUserRequest>(
  username: DeleteUserPathParams['username'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: () => {
      return client<TData, TVariables>({
        method: 'delete',
        url: `/user/${username}`,
      })
    },
    ...mutationOptions,
  })
}
