import { rest } from 'msw'
import { createDeleteUserMutationResponse } from '../../mocks/userMocks/createDeleteUser'

export const deleteUserHandler = rest.delete('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createDeleteUserMutationResponse()))
})
