import type client from '@kubb/plugin-client/clients/axios'
import type { UpdateUserMutationRequest, UpdateUserPathParams } from '../models/ts/UpdateUser.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { updateUser } from '../clients/updateUser.js'

export async function updateUserHandler(
  username: UpdateUserPathParams['username'],
  data?: UpdateUserMutationRequest,
  config: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await updateUser(username, data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
