import client from '../../../client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function addPet<TData = AddPetMutationResponse, TVariables = AddPetMutationRequest>(
  data: TVariables,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pet`,
    data,
    ...options,
  })
}
