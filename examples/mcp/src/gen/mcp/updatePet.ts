import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/ts/UpdatePet.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePetHandler({ data }: { data: UpdatePetMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<UpdatePetMutationResponse, ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>, UpdatePetMutationRequest>({
    method: 'PUT',
    url: '/pet',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
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
