import { createCreateUserMutationResponseFaker } from '../../mocks/userController/createCreateUserFaker.js'
import { http } from 'msw'

export const createUserHandler = http.post('*/user', function handler(info) {
  return new Response(JSON.stringify(createCreateUserMutationResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
