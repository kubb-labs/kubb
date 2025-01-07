import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.ts'
import { deleteUserMutationResponseSchema } from '../../../zod/userController/deleteUserSchema.ts'

export const deleteUserMutationKeySWR = () => [{ url: '/user/{username}' }] as const

export type DeleteUserMutationKeySWR = ReturnType<typeof deleteUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
async function deleteUserSWR({ username }: { username: DeleteUserPathParams['username'] }, config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return deleteUserMutationResponseSchema.parse(res.data)
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUserSWR(
  { username }: { username: DeleteUserPathParams['username'] },
  options: {
    mutation?: Parameters<typeof useSWRMutation<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, DeleteUserMutationKeySWR>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deleteUserMutationKeySWR()

  return useSWRMutation<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, DeleteUserMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deleteUserSWR({ username }, config)
    },
    mutationOptions,
  )
}
