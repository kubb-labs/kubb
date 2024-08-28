import { createUpdatePetWithFormMutationResponse } from '../../mocks/petController/createUpdatePetWithForm.ts'
import { http } from 'msw'

export const updatePetWithFormHandler = http.post('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createUpdatePetWithFormMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
