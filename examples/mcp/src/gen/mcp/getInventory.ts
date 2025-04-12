import type client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { getInventory } from '../clients/getInventory.js'

export async function getInventoryHandler(config: Partial<RequestConfig> & { client?: typeof client } = {}): Promise<Promise<CallToolResult>> {
  const res = await getInventory(config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
