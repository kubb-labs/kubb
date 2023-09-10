import { rest } from 'msw'
import { createCreateUserMutationResponse } from '../../mocks/userController/createCreateUser'

export const mockCreateUserHandler = rest.get('*/user', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUserMutationResponse()))
})
