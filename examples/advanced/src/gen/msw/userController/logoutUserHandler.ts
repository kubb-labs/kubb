import { rest } from 'msw'
import { createLogoutuserqueryresponse } from '../../mocks/userController/createLogoutuser'

export const logoutuserHandler = rest.get('*/user/logout', function handler(req, res, ctx) {
  return res(ctx.json(createLogoutuserqueryresponse()))
})
