import type client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByStatusQueryParams } from '../models/ts/FindPetsByStatus.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { findPetsByStatus } from '../clients/findPetsByStatus.js'

export async function findPetsByStatusHandler(
  params?: FindPetsByStatusQueryParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await findPetsByStatus(params, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
