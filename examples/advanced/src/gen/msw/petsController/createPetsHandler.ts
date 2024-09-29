import { createCreatePetsMutationResponseFaker } from '../../mocks/petsController/createCreatePetsFaker.ts'
import { http } from 'msw'

export const createPetsHandler = http.post('*/pets/:uuid', function handler(info) {
  return new Response(JSON.stringify(createCreatePetsMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
