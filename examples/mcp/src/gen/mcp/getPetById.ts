import type client from '@kubb/plugin-client/clients/axios'
import type { GetPetByIdPathParams } from '../models/ts/GetPetById.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { getPetById } from '../clients/getPetById.js'

export async function getPetByIdHandler(
  petId: GetPetByIdPathParams['petId'],
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await getPetById(petId, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
