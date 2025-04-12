import type client from '@kubb/plugin-client/clients/axios'
import type { UpdatePetMutationRequest } from '../models/ts/UpdatePet.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { updatePet } from '../clients/updatePet.js'

export async function updatePetHandler(
  data: UpdatePetMutationRequest,
  config: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await updatePet(data, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
