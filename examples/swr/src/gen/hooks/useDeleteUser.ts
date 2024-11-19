import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../models/DeleteUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

export const deleteUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type DeleteUserMutationKey = ReturnType<typeof deleteUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
async function deleteUser(username: DeleteUserPathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, unknown>({ method: 'DELETE', url: `/user/${username}`, ...config })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUser(
  username: DeleteUserPathParams['username'],
  options: {
    mutation?: Parameters<typeof useSWRMutation<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, DeleteUserMutationKey>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deleteUserMutationKey()
  return useSWRMutation<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, DeleteUserMutationKey | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deleteUser(username, config)
    },
    mutationOptions,
  )
}
