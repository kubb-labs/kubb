import { rest } from 'msw'
import { createUpdateusermutationresponse, createUpdateusermutationrequest } from '../../mocks/userController/createUpdateuser'

export const updateuserHandler = rest.put('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createUpdateusermutationresponse()))
})
