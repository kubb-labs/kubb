import type client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByTagsQueryParams } from '../models/ts/FindPetsByTags.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { findPetsByTags } from '../clients/findPetsByTags.js'

export async function findPetsByTagsHandler(
  params?: FindPetsByTagsQueryParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await findPetsByTags(params, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
