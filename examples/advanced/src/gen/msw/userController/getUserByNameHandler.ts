import { rest } from 'msw'
import { createGetuserbynamequeryresponse } from '../../mocks/userController/createGetuserbyname'

export const getuserbynameHandler = rest.get('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createGetuserbynamequeryresponse()))
})
