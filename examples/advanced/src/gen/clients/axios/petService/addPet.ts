import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet.ts'
import { addPetMutationRequestSchema, addPetMutationResponseSchema } from '../../../zod/petController/addPetSchema.ts'

export function getAddPetUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/pet' as const }
  return res
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(
  { data }: { data: AddPetMutationRequest },
  config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = addPetMutationRequestSchema.parse(data)

  const res = await request<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: addPetMutationResponseSchema.parse(res.data) }
}
