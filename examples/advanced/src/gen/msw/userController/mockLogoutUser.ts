import { rest } from 'msw'
import { createLogoutUserQueryResponse } from '../../mocks/userController/createLogoutUser'

export const mockLogoutUserHandler = rest.get('*/user/logout', function handler(req, res, ctx) {
  return res(ctx.json(createLogoutUserQueryResponse()))
})
