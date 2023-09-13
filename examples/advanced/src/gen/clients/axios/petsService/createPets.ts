import client from '../../../client'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function createPets<TData = CreatePetsMutationResponse, TVariables = CreatePetsMutationRequest>(
  uuid: CreatePetsPathParams['uuid'],
  data: TVariables,
  params?: CreatePetsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pets/${uuid}`,
    params,
    data,
    ...options,
  })
}
