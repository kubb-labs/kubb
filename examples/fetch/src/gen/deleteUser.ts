import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from './models.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export async function deleteUser(
  username: DeleteUserPathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeleteUserMutationResponse>['data']> {
  const res = await client<DeleteUserMutationResponse>({ method: 'delete', url: `/user/${username}`, ...options })
  return res.data
}
