import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.ts'
import { deleteUserMutationResponseSchema } from '../../../zod/userController/deleteUserSchema.ts'

export function getDeleteUserUrl({ username }: { username: DeleteUserPathParams['username'] }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/user/${username}` as const }
  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser(
  { username }: { username: DeleteUserPathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: getDeleteUserUrl({ username }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: deleteUserMutationResponseSchema.parse(res.data) }
}
