import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'

function getUpdatePetUrl() {
  return 'https://petstore3.swagger.io/api/v3/pet' as const
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(
  { data }: { data: UpdatePetMutationRequest },
  config: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetMutationResponse, ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>, UpdatePetMutationRequest>({
    method: 'PUT',
    url: getUpdatePetUrl().toString(),
    data,
    ...requestConfig,
  })
  return res
}
