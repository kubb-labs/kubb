import { createLogoutUserQueryResponse } from '../../mocks/userController/createLogoutUser.ts'
import { http } from 'msw'

export const logoutUserHandler = http.get('*/user/logout', function handler(info) {
  return new Response(JSON.stringify(createLogoutUserQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
