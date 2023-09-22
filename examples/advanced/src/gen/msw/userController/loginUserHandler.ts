import { rest } from 'msw'
import { createLoginuserqueryresponse } from '../../mocks/userController/createLoginuser'

export const loginuserHandler = rest.get('*/user/login', function handler(req, res, ctx) {
  return res(ctx.json(createLoginuserqueryresponse()))
})
