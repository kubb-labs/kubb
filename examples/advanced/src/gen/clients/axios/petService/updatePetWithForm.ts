import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export async function updatePetWithForm(
  {
    petId,
  }: {
    petId: UpdatePetWithFormPathParams['petId']
  },
  params?: UpdatePetWithFormQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdatePetWithFormMutationResponse>> {
  const res = await client<UpdatePetWithFormMutationResponse>({ method: 'post', url: `/pet/${petId}`, params, ...options })
  return res
}
