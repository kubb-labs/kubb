import type client from '@kubb/plugin-client/clients/axios'
import type { DeleteUserPathParams } from '../models/ts/DeleteUser.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { deleteUser } from '../clients/deleteUser.js'

export async function deleteUserHandler(
  username: DeleteUserPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await deleteUser(username, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
