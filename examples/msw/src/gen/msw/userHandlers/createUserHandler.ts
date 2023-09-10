import { rest } from 'msw'
import { createCreateUserMutationResponse, createCreateUserMutationRequest } from '../../mocks/userMocks/createCreateUser'

export const createUserHandler = rest.post('*/user', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUserMutationResponse()))
})
