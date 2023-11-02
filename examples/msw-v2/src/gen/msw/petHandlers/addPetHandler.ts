import { http } from 'msw'
import { createAddPetMutationResponse } from '../../mocks/petMocks/createAddPet'

export const addPetHandler = http.post('*/pet', function handler(info) {
  return new Response(JSON.stringify(createAddPetMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
