import type client from '@kubb/plugin-client/clients/axios'
import type { CreateUserMutationRequest } from '../models/ts/CreateUser.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { createUser } from '../clients/createUser.js'

export async function createUserHandler(
  data?: CreateUserMutationRequest,
  config: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await createUser(data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
