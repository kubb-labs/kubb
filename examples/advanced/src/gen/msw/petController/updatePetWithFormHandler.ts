import { http } from 'msw'
import { createUpdatePetWithFormMutationResponse } from '../../mocks/petController/createUpdatePetWithForm'

export const updatePetWithFormHandler = http.post('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createUpdatePetWithFormMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
