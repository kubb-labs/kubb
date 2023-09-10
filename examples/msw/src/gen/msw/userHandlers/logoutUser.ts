import { rest } from 'msw'
import { createLogoutUserQueryResponse } from '../../mocks/userMocks/createLogoutUser'

export const logoutUserHandler = rest.get('*/user/logout', function handler(req, res, ctx) {
  return res(ctx.json(createLogoutUserQueryResponse()))
})
