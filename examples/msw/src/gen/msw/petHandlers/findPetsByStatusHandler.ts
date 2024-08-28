import { createFindPetsByStatusQueryResponse } from '../../mocks/petMocks/createFindPetsByStatus.ts'
import { http } from 'msw'

export const findPetsByStatusHandler = http.get('*/pet/findByStatus', function handler(info) {
  return new Response(JSON.stringify(createFindPetsByStatusQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
