import client from '../../../client'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatepetsQueryparams,
  CreatepetsHeaderparams,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */

export function createPets<TData = CreatePetsMutationResponse, TVariables = CreatePetsMutationRequest>(
  uuid: CreatePetsPathParams['uuid'],
  data: TVariables,
  headers: CreatepetsHeaderparams,
  params?: CreatepetsQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pets/${uuid}`,
    params,
    data,
    headers: { ...headers, ...options.headers },
    ...options,
  })
}
