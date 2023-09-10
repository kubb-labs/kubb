import { rest } from 'msw'
import { createCreateUserMutationResponse, createCreateUserMutationRequest } from '../../mocks/userMocks/createCreateUser'

export const createUserHandler = rest.get('*/user', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUserMutationResponse()))
})
