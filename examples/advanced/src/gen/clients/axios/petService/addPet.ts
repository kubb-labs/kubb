import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.ts'
import { addPetMutationResponseSchema, addPetMutationRequestSchema } from '../../../zod/petController/addPetSchema.ts'

function getAddPetUrl() {
  return 'https://petstore3.swagger.io/api/v3/pet' as const
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(
  { data }: { data: AddPetMutationRequest },
  config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
    method: 'POST',
    url: getAddPetUrl().toString(),
    data: addPetMutationRequestSchema.parse(data),
    ...requestConfig,
  })
  return { ...res, data: addPetMutationResponseSchema.parse(res.data) }
}
