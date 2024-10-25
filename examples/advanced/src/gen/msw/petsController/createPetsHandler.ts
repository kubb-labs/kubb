import type { CreatePetsMutationResponse } from '../../models/ts/petsController/CreatePets.ts'
import { http } from 'msw'

export function createPetsHandler(data?: CreatePetsMutationResponse) {
  return http.post('*/pets/:uuid', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
