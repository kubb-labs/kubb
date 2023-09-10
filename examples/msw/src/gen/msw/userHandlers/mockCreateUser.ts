import { rest } from 'msw'
import { createCreateUserMutationResponse, createCreateUserMutationRequest } from '../../mocks/userMocks/createCreateUser'

export const mockCreateUserHandler = rest.get('*/user', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUserMutationResponse()))
})
