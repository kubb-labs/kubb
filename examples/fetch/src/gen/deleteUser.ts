import client from '@kubb/plugin-client/clients/fetch'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getDeleteUserUrl(username: DeleteUserPathParams['username']) {
  return new URL(`/user/${username}`)
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser(username: DeleteUserPathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: getDeleteUserUrl(username).toString(),
    ...config,
  })
  return res.data
}
