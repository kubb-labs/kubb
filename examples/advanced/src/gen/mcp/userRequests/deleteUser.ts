import fetch from '@kubb/plugin-client/clients/axios'
import type { DeleteUserResponseData, DeleteUserPathParams, DeleteUserStatus400, DeleteUserStatus404 } from '../../models/ts/userController/DeleteUser.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUserHandler({ username }: { username: DeleteUserPathParams['username'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeleteUserResponseData, ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>, unknown>({
    method: 'DELETE',
    url: `/user/${username}`,
    baseURL: 'https://petstore.swagger.io/v2',
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
