import { createCreatePetsMutationResponse } from '../../mocks/petsController/createCreatePets.ts'
import { http } from 'msw'

export const createPetsHandler = http.post('*/pets/:uuid', function handler(info) {
  return new Response(JSON.stringify(createCreatePetsMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
