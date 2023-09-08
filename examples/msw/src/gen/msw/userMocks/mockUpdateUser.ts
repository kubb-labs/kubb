import { rest } from 'msw'
import { createUpdateUserMutationResponse, createUpdateUserMutationRequest } from '../../mocks/userMocks/createUpdateUser'

export const mockUpdateUserHandler = rest.get('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createUpdateUserMutationResponse()))
})
