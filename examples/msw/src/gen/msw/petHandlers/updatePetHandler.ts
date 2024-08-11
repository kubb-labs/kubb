import { http } from 'msw'
import { createUpdatePetMutationResponse } from '../../mocks/petMocks/createUpdatePet'

export const updatePetHandler = http.put('*/pet', function handler(info) {
  return new Response(JSON.stringify(createUpdatePetMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
