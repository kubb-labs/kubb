import { http } from 'msw'
import { createOptionsFindPetsByStatusMutationResponse } from '../../mocks/petMocks/createOptionsFindPetsByStatus'

export const optionsFindPetsByStatusHandler = http.options('*/pet/findByStatus', function handler(info) {
  return new Response(JSON.stringify(createOptionsFindPetsByStatusMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
