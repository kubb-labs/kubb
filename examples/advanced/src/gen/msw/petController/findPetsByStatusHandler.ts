import { http } from 'msw'
import { createFindPetsByStatusQueryResponse } from '../../mocks/petController/createFindPetsByStatus'

export const findPetsByStatusHandler = http.get('*/pet/findByStatus', function handler(info) {
  return new Response(JSON.stringify(createFindPetsByStatusQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
