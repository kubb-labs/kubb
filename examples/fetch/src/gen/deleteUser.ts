import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from './models.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export async function deleteUser(username: DeleteUserPathParams['username'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, unknown>({
    method: 'delete',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}
