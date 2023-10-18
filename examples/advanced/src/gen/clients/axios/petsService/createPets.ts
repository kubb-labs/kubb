import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export async function createPets<TData = CreatePetsMutationResponse, TVariables = CreatePetsMutationRequest>(
  { uuid }: CreatePetsPathParams,
  data: TVariables,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pets/${uuid}`,
    params,
    data,
    headers: { ...headers, ...options.headers },
    ...options,
  })
}
