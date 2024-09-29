import { createOptionsFindPetsByStatusMutationResponse } from '../../../mocks/petController/createOptionsFindPetsByStatus.ts'
import { http } from 'msw'

export const optionsFindPetsByStatusHandler = http.options('*/pet/findByStatus', function handler(info) {
  return new Response(JSON.stringify(createOptionsFindPetsByStatusMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
