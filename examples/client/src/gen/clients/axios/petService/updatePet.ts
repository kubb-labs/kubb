import client from '@kubb/plugin-client/client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../../models/ts/petController/UpdatePet'
import type { ResponseConfig } from '@kubb/plugin-client/client'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export async function updatePet(
  data: UpdatePetMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdatePetMutationResponse>['data']> {
  const res = await client<UpdatePetMutationResponse, UpdatePetMutationRequest>({
    method: 'put',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...options,
  })
  return res.data
}
