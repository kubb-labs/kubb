import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { DeleteUserPathParams, DeleteUserMutationResponse, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { deleteUser } from '../../axios/userService/deleteUser.ts'

export const deleteUserSWRMutationKey = () => [{ url: '/user/:username' }] as const

export type DeleteUserSWRMutationKey = ReturnType<typeof deleteUserSWRMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUserSWR(
  { username }: { username: DeleteUserPathParams['username'] },
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<DeleteUserMutationResponse>,
      ResponseErrorConfig<DeleteUser400 | DeleteUser404>,
      DeleteUserSWRMutationKey | null,
      never
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deleteUserSWRMutationKey()

  return useSWRMutation<ResponseConfig<DeleteUserMutationResponse>, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, DeleteUserSWRMutationKey | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deleteUser({ username }, config)
    },
    mutationOptions,
  )
}
