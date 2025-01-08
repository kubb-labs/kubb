import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'

export function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathParams['petId'] }) {
  return `https://petstore3.swagger.io/api/v3/pet/${petId}`
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { petId, params }: { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl({ petId }).toString(),
    params,
    ...config,
  })
  return res
}
