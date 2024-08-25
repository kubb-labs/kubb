import type { ResponseConfig } from '@kubb/plugin-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'
import client from '@kubb/plugin-client/client'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export async function addPet(
  data: AddPetMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<AddPetMutationResponse>['data']> {
  const res = await client<AddPetMutationResponse, AddPetMutationRequest>({
    method: 'post',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...options,
  })
  return res.data
}
