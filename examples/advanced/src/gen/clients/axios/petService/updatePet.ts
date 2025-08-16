import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'
import { updatePetMutationResponseSchema, updatePetMutationRequestSchema } from '../../../zod/petController/updatePetSchema.ts'

export function getUpdatePetUrl() {
  return 'https://petstore3.swagger.io/api/v3/pet' as const
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(
  { data }: { data: UpdatePetMutationRequest },
  config: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = updatePetMutationRequestSchema.parse(data)
  const res = await request<UpdatePetMutationResponse, ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>, UpdatePetMutationRequest>({
    method: 'PUT',
    url: getUpdatePetUrl().toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: updatePetMutationResponseSchema.parse(res.data) }
}
