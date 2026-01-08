import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  DeleteUserResponseData3,
  DeleteUserPathParams3,
  DeleteUserStatus4003,
  DeleteUserStatus4043,
} from '../../../models/ts/userController/DeleteUser.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { deleteUser } from '../../axios/userService/deleteUser.ts'

export const deleteUserMutationKeySWR = () => [{ url: '/user/:username' }] as const

export type DeleteUserMutationKeySWR = ReturnType<typeof deleteUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUserSWR(
  { username }: { username: DeleteUserPathParams3['username'] },
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<DeleteUserResponseData3>,
      ResponseErrorConfig<DeleteUserStatus4003 | DeleteUserStatus4043>,
      DeleteUserMutationKeySWR | null,
      never
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deleteUserMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<DeleteUserResponseData3>,
    ResponseErrorConfig<DeleteUserStatus4003 | DeleteUserStatus4043>,
    DeleteUserMutationKeySWR | null
  >(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deleteUser({ username }, config)
    },
    mutationOptions,
  )
}
