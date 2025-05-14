import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPetsMutationResponseSchema, createPetsMutationRequestSchema } from '../../../zod/petsController/createPetsSchema.ts'

function getCreatePetsUrl({ uuid }: { uuid: CreatePetsPathParams['uuid'] }) {
  return `https://petstore3.swagger.io/api/v3/pets/${uuid}` as const
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
  config: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).toString(),
    params,
    data: createPetsMutationRequestSchema.parse(data),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: createPetsMutationResponseSchema.parse(res.data) }
}
