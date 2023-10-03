import { rest } from 'msw'
import { createCreateUsersWithListInputMutationResponse } from '../../mocks/userMocks/createCreateUsersWithListInput'

export const createUsersWithListInputHandler = rest.post('*/user/createWithList', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUsersWithListInputMutationResponse()))
})
