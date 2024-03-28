import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export async function createPets(
  { uuid }: CreatePetsPathParams,
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
