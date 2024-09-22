import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithForm405 } from './models.ts'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export async function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}
