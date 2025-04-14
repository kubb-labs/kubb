import client from '@kubb/plugin-client/clients/axios'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/ts/UpdatePetWithForm.js'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithFormHandler({
  petId,
  params,
}: {
  petId: UpdatePetWithFormPathParams['petId']
  params?: UpdatePetWithFormQueryParams
}): Promise<Promise<CallToolResult>> {
  const res = await client<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore.swagger.io/v2',
    params,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
