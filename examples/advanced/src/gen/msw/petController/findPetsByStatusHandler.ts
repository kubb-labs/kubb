import { createFindPetsByStatusQueryResponseFaker } from '../../mocks/petController/createFindPetsByStatusFaker.js'
import { http } from 'msw'

export const findPetsByStatusHandler = http.get('*/pet/findByStatus', function handler(info) {
  return new Response(JSON.stringify(createFindPetsByStatusQueryResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
