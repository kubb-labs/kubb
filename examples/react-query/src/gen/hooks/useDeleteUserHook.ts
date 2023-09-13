import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400 } from '../models/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function useDeleteUserHook<TData = DeleteUserMutationResponse, TError = DeleteUser400>(
  username: DeleteUserPathParams['username'],
  options?: {
    mutation?: UseMutationOptions<TData, TError, void>
    client: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  },
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/user/${username}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
