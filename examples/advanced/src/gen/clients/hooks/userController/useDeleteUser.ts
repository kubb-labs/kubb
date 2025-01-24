import type client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { deleteUser } from '../../axios/userService/deleteUser.ts'
import { useMutation } from '@tanstack/react-query'

export const deleteUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type DeleteUserMutationKey = ReturnType<typeof deleteUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUser(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<DeleteUserMutationResponse>,
      ResponseErrorConfig<DeleteUser400 | DeleteUser404>,
      { username: DeleteUserPathParams['username'] }
    >
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deleteUserMutationKey()

  return useMutation<
    ResponseConfig<DeleteUserMutationResponse>,
    ResponseErrorConfig<DeleteUser400 | DeleteUser404>,
    { username: DeleteUserPathParams['username'] }
  >({
    mutationFn: async ({ username }) => {
      return deleteUser({ username }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
