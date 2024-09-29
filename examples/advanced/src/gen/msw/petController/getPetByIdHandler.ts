import { createGetPetByIdQueryResponseFaker } from '../../mocks/petController/createGetPetByIdFaker.ts'
import { http } from 'msw'

export const getPetByIdHandler = http.get('*/pet/:petId', function handler(info) {
  return new Response(JSON.stringify(createGetPetByIdQueryResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
