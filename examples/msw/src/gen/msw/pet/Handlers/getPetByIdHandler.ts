import { createGetPetByIdQueryResponse } from '../../../mocks/petController/createGetPetById.ts'
import { http } from 'msw'

export const getPetByIdHandler = http.get('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createGetPetByIdQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
