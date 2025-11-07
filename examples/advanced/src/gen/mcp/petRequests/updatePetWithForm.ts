import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export async function updatePetWithFormHandler({
  petId,
  params,
}: {
  petId: UpdatePetWithFormPathParams['petId']
  params?: UpdatePetWithFormQueryParams
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: `/pet/${petId}:search`,
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
