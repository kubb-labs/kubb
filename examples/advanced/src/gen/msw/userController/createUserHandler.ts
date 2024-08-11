import { http } from 'msw'
import { createCreateUserMutationResponse } from '../../mocks/userController/createCreateUser'

export const createUserHandler = http.post('*/user', function handler(info) {
  return new Response(JSON.stringify(createCreateUserMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
