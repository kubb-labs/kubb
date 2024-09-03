import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from './models.ts'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export async function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdatePetWithFormMutationResponse>['data']> {
  const res = await client<UpdatePetWithFormMutationResponse>({ method: 'post', url: `/pet/${petId}`, params, ...options })
  return res.data
}
