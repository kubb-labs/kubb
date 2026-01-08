import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { DeletePetHeaderParams, DeletePetPathParams, DeletePetResponseData, DeletePetStatus400 } from '../models/ts/DeletePet.js'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePetHandler({
  petId,
  headers,
}: {
  petId: DeletePetPathParams['petId']
  headers?: DeletePetHeaderParams
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeletePetResponseData, ResponseErrorConfig<DeletePetStatus400>, unknown>({
    method: 'DELETE',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore.swagger.io/v2',
    headers: { ...headers },
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
