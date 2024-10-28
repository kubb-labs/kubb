import client from '../../../../axios-client.ts'
import type { RequestConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export async function updatePetWithForm(
  {
    pathParams: { petId },
    params,
  }: {
    pathParams: UpdatePetWithFormPathParams
    params?: UpdatePetWithFormQueryParams
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res
}
