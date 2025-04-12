import type client from '@kubb/plugin-client/clients/axios'
import type { DeletePetPathParams, DeletePetHeaderParams } from '../models/ts/DeletePet.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { deletePet } from '../clients/deletePet.js'

export async function deletePetHandler(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await deletePet(petId, headers, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
