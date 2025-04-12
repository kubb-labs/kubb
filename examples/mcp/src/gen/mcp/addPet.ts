import type client from '@kubb/plugin-client/clients/axios'
import type { AddPetMutationRequest } from '../models/ts/AddPet.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { addPet } from '../clients/addPet.js'

export async function addPetHandler(
  data: AddPetMutationRequest,
  config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await addPet(data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
