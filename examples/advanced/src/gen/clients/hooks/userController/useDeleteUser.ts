import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  DeleteUserResponseData9,
  DeleteUserPathParams9,
  DeleteUserStatus4009,
  DeleteUserStatus4049,
} from '../../../models/ts/userController/DeleteUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { deleteUser } from '../../axios/userService/deleteUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const deleteUserMutationKey = () => [{ url: '/user/:username' }] as const

export type DeleteUserMutationKey = ReturnType<typeof deleteUserMutationKey>

export function deleteUserMutationOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const mutationKey = deleteUserMutationKey()
  return mutationOptions<
    ResponseConfig<DeleteUserResponseData9>,
    ResponseErrorConfig<DeleteUserStatus4009 | DeleteUserStatus4049>,
    { username: DeleteUserPathParams9['username'] },
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
      ResponseConfig<DeleteUserResponseData9>,
      ResponseErrorConfig<DeleteUserStatus4009 | DeleteUserStatus4049>,
      { username: DeleteUserPathParams9['username'] },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deleteUserMutationKey()

  const baseOptions = deleteUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeleteUserResponseData9>,
    ResponseErrorConfig<DeleteUserStatus4009 | DeleteUserStatus4049>,
    { username: DeleteUserPathParams9['username'] },
    TContext
  >

  return useMutation<
    ResponseConfig<DeleteUserResponseData9>,
    ResponseErrorConfig<DeleteUserStatus4009 | DeleteUserStatus4049>,
    { username: DeleteUserPathParams9['username'] },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<DeleteUserResponseData9>,
    ResponseErrorConfig<DeleteUserStatus4009 | DeleteUserStatus4049>,
    { username: DeleteUserPathParams9['username'] },
    TContext
  >
}
