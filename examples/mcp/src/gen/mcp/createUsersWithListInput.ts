import type client from '@kubb/plugin-client/clients/axios'
import type { CreateUsersWithListInputMutationRequest } from '../models/ts/CreateUsersWithListInput.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { createUsersWithListInput } from '../clients/createUsersWithListInput.js'

export async function createUsersWithListInputHandler(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await createUsersWithListInput(data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
