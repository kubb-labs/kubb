import { createUpdatePetWithFormMutationResponseFaker } from '../../mocks/petController/createUpdatePetWithFormFaker.ts'
import { http } from 'msw'

export const updatePetWithFormHandler = http.post('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createUpdatePetWithFormMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
