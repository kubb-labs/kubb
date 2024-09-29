import { createLoginUserQueryResponse } from '../../../mocks/userController/createLoginUser.ts'
import { http } from 'msw'

export const loginUserHandler = http.get('*/user/login', function handler(info) {
  return new Response(JSON.stringify(createLoginUserQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
