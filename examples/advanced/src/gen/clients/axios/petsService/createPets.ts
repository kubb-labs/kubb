import type { ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets'
import client from '../../../../axios-client.ts'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export async function createPets(
  {
    uuid,
  }: {
    uuid: CreatePetsPathParams['uuid']
  },
  data: CreatePetsMutationRequest,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreatePetsMutationResponse>> {
  const res = await client<CreatePetsMutationResponse, CreatePetsMutationRequest>({
    method: 'post',
    url: `/pets/${uuid}`,
    params,
    data,
    headers: { ...headers, ...options.headers },
    ...options,
  })
  return res
}
