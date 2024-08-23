import { http } from 'msw'
import { createGetPetByIdQueryResponse } from '../../mocks/petController/createGetPetById'

export const getPetByIdHandler = http.get('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createGetPetByIdQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
