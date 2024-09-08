import client from '../../../../axios-client.ts'
import type { RequestConfig } from '../../../../axios-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export async function deleteUser(
  {
    username,
  }: {
    username: DeleteUserPathParams['username']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, unknown>({
    method: 'delete',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res
}
