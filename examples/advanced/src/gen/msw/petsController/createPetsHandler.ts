import { http } from 'msw'
import { createCreatePetsMutationResponse } from '../../mocks/petsController/createCreatePets'

export const createPetsHandler = http.post('*/pets/:uuid', function handler(info) {
  return new Response(JSON.stringify(createCreatePetsMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
