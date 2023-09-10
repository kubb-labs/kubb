import { rest } from 'msw'
import { createDeleteUserMutationResponse } from '../../mocks/userController/createDeleteUser'

export const deleteUserHandler = rest.get('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createDeleteUserMutationResponse()))
})
