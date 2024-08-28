import { createAddPetMutationResponse } from '../../mocks/petController/createAddPet.ts'
import { http } from 'msw'

export const addPetHandler = http.post('*/pet', function handler(info) {
  return new Response(JSON.stringify(createAddPetMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
