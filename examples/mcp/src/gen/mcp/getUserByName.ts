import type client from '@kubb/plugin-client/clients/axios'
import type { GetUserByNamePathParams } from '../models/ts/GetUserByName.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { getUserByName } from '../clients/getUserByName.js'

export async function getUserByNameHandler(
  username: GetUserByNamePathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await getUserByName(username, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
