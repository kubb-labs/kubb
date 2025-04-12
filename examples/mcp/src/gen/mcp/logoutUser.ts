import type client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { logoutUser } from '../clients/logoutUser.js'

export async function logoutUserHandler(config: Partial<RequestConfig> & { client?: typeof client } = {}): Promise<Promise<CallToolResult>> {
  const res = await logoutUser(config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
