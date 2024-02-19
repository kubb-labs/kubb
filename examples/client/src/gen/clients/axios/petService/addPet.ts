import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */

export async function addPet(
  data: AddPetMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<AddPetMutationResponse>['data']> {
  const res = await client<AddPetMutationResponse, AddPetMutationRequest>({
    method: 'post',
    url: `/pet`,
    data,
    ...options,
  })
  return res.data
}
