import { rest } from 'msw'
import { createUpdateUserMutationResponse } from '../../mocks/userController/createUpdateUser'

export const mockUpdateUserHandler = rest.get('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createUpdateUserMutationResponse()))
})
