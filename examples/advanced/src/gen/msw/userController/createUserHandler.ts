import { createCreateUserMutationResponse } from '../../mocks/userController/createCreateUser.ts'
import { http } from 'msw'

export const createUserHandler = http.post('*/user', function handler(info) {
  return new Response(JSON.stringify(createCreateUserMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
