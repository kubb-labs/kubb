import client from '../../../../client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function addPet<TData = AddPetMutationResponse, TVariables = AddPetMutationRequest>(data: TVariables) {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pet`,
    data,
  })
}
