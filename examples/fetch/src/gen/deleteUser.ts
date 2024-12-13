import client from '@kubb/plugin-client/clients/fetch'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from './models.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser(username: DeleteUserPathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, unknown>({ method: 'DELETE', url: `/user/${username}`, ...config })
  return res.data
}
