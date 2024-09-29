import { createLoginUserQueryResponseFaker } from '../../mocks/userController/createLoginUserFaker.js'
import { http } from 'msw'

export const loginUserHandler = http.get('*/user/login', function handler(info) {
  return new Response(JSON.stringify(createLoginUserQueryResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
