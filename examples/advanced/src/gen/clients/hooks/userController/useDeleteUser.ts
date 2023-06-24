import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '../../../../client'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function useDeleteUser<TData = DeleteUserMutationResponse, TError = DeleteUser400 | DeleteUser404>(
  username: DeleteUserPathParams['username'],
  options?: {
    mutation?: UseMutationOptions<TData, TError>
  }
): UseMutationResult<TData, TError> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError>({
    mutationFn: () => {
      return client<TData, TError>({
        method: 'delete',
        url: `/user/${username}`,
      })
    },
    ...mutationOptions,
  })
}
