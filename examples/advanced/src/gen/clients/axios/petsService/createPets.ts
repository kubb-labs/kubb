import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
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
  config: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const mappedParams = params ? { bool_param: params.boolParam } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestData = createPetsMutationRequestSchema.parse(data)

  const res = await request<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).url.toString(),
    params: mappedParams,
    data: requestData,
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })
  return { ...res, data: createPetsMutationResponseSchema.parse(res.data) }
}
