import type client from '@kubb/plugin-client/clients/axios'
import type { UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from '../models/ts/UpdatePetWithForm.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { updatePetWithForm } from '../clients/updatePetWithForm.js'

export async function updatePetWithFormHandler(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await updatePetWithForm(petId, params, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}
