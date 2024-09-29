import { createLogoutUserQueryResponseFaker } from '../../mocks/userController/createLogoutUserFaker.ts'
import { http } from 'msw'

export const logoutUserHandler = http.get('*/user/logout', function handler(info) {
  return new Response(JSON.stringify(createLogoutUserQueryResponseFaker()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
