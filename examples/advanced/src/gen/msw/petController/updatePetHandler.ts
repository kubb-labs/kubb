import { createUpdatePetMutationResponse } from '../../mocks/petController/createUpdatePet.ts'
import { http } from 'msw'

export const updatePetHandler = http.put('*/pet', function handler(info) {
  return new Response(JSON.stringify(createUpdatePetMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
