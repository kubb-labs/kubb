import { createCreateUsersWithListInputMutationResponse } from '../../mocks/userMocks/createCreateUsersWithListInput.ts'
import { http } from 'msw'

export const createUsersWithListInputHandler = http.post('*/user/createWithList', function handler(info) {
  return new Response(JSON.stringify(createCreateUsersWithListInputMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
