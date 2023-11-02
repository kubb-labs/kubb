import { http } from 'msw'
import { createLogoutUserQueryResponse } from '../../mocks/userMocks/createLogoutUser'

export const logoutUserHandler = http.get('*/user/logout', function handler(info) {
  return new Response(JSON.stringify(createLogoutUserQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
