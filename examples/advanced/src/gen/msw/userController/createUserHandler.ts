import { rest } from 'msw'
import { createCreateusermutationresponse, createCreateusermutationrequest } from '../../mocks/userController/createCreateuser'

export const createuserHandler = rest.post('*/user', function handler(req, res, ctx) {
  return res(ctx.json(createCreateusermutationresponse()))
})
