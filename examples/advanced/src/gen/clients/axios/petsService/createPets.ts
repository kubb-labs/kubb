import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPetsMutationResponseSchema, createPetsMutationRequestSchema } from '../../../zod/petsController/createPetsSchema.ts'

export function getCreatePetsUrl({ uuid }: { uuid: CreatePetsPathParams['uuid'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pets/${uuid}` as const }
  return res
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPets(
  {
    uuid,
    data,
    headers,
    params,
  }: { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
  config: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createPetsMutationRequestSchema.parse(data)
  const res = await request<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: createPetsMutationResponseSchema.parse(res.data) }
}
