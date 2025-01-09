import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'

export function getCreatePetsUrl({ uuid }: { uuid: CreatePetsPathParams['uuid'] }) {
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
  config: Partial<RequestConfig<CreatePetsMutationRequest>> = {},
) {
  const res = await client<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).toString(),
    params,
    data,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res
}
