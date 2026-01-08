import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteUserPathParams, DeleteUserResponseData, DeleteUserStatus400, DeleteUserStatus404 } from '../../../models/ts/userController/DeleteUser.ts'
import { deleteUser } from '../../axios/userService/deleteUser.ts'

export const deleteUserMutationKey = () => [{ url: '/user/:username' }] as const

export type DeleteUserMutationKey = ReturnType<typeof deleteUserMutationKey>

export function deleteUserMutationOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const mutationKey = deleteUserMutationKey()
  return mutationOptions<
    ResponseConfig<DeleteUserResponseData>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathParams['username'] },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ username }) => {
      return deleteUser({ username }, config)
    },
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUser<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<DeleteUserResponseData>,
      ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
      { username: DeleteUserPathParams['username'] },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deleteUserMutationKey()

  const baseOptions = deleteUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeleteUserResponseData>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathParams['username'] },
    TContext
  >

  return useMutation<
    ResponseConfig<DeleteUserResponseData>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathParams['username'] },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<DeleteUserResponseData>,
    ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>,
    { username: DeleteUserPathParams['username'] },
    TContext
  >
}
