import { createDeletePetMutationResponseFaker } from '../../mocks/petController/createDeletePetFaker.js'
import { http } from 'msw'

export const deletePetHandler = http.delete('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createDeletePetMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
