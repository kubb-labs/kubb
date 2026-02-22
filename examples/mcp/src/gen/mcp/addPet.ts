import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../models/ts/AddPet.js'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler({ data }: { data: AddPetMutationRequest }) {
  const requestData = data

  const res = await fetch<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
    method: 'POST',
    url: '/pet',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
