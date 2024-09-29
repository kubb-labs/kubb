import { createUpdatePetMutationResponseFaker } from '../../mocks/petController/createUpdatePetFaker.ts'
import { http } from 'msw'

export const updatePetHandler = http.put('*/pet', function handler(info) {
  return new Response(JSON.stringify(createUpdatePetMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
