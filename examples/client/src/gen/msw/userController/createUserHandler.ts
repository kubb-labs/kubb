import { rest } from 'msw'
import { createCreateUserMutationResponse } from '../../mocks/userController/createCreateUser'

export const createUserHandler = rest.post('*/user', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUserMutationResponse()))
})
