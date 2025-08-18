import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import { updatePetWithFormMutationResponseSchema } from '../../../zod/petController/updatePetWithFormSchema.ts'

export function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathParams['petId'] }) {
  const res = {
    method: 'POST',
    url: `https://petstore3.swagger.io/api/v3/pet/${petId}:search` as const,
  }
  return res
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export async function updatePetWithForm(
  { petId, params }: { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl({ petId }).url.toString(),
    params,
    ...requestConfig,
  })
  return { ...res, data: updatePetWithFormMutationResponseSchema.parse(res.data) }
}
