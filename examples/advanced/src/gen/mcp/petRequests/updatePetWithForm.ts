import fetch from '@kubb/plugin-client/clients/axios'
import type {
  UpdatePetWithFormResponseData,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormStatus405,
} from '../../models/ts/petController/UpdatePetWithForm.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

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
  const res = await fetch<UpdatePetWithFormResponseData, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
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
