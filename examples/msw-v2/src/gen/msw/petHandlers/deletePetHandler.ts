import { http } from 'msw'

import { createDeletePetMutationResponse } from '../../mocks/petMocks/createDeletePet'

export const deletePetHandler = http.delete('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createDeletePetMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
