import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.ts'

export function getDeleteUserUrl({ username }: { username: DeleteUserPathParams['username'] }) {
  return new URL(`/user/${username}`, 'https://petstore3.swagger.io/api/v3')
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser({ username }: { username: DeleteUserPathParams['username'] }, config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: getDeleteUserUrl({ username }).toString(),
    ...config,
  })
  return res
}
