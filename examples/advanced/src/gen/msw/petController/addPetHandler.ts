import { createAddPetMutationResponseFaker } from '../../mocks/petController/createAddPetFaker.js'
import { http } from 'msw'

export const addPetHandler = http.post('*/pet', function handler(info) {
  return new Response(JSON.stringify(createAddPetMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
