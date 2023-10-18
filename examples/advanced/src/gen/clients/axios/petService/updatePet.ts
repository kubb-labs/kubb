import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export async function updatePet<TData = UpdatePetMutationResponse, TVariables = UpdatePetMutationRequest>(
  data: TVariables,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData, TVariables>({
    method: 'put',
    url: `/pet`,
    data,
    ...options,
  })
}
