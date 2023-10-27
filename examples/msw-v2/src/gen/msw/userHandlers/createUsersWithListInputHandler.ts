import { http } from 'msw'
import { createCreateUsersWithListInputMutationResponse } from '../../mocks/userMocks/createCreateUsersWithListInput'

export const createUsersWithListInputHandler = http.post('*/user/createWithList', function handler(info) {
  return new Response(JSON.stringify(createCreateUsersWithListInputMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
