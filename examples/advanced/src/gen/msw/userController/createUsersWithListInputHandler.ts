import { rest } from 'msw'
import {
  createCreateUsersWithListInputMutationResponse,
  createCreateUsersWithListInputMutationRequest,
} from '../../mocks/userController/createCreateUsersWithListInput'

export const createUsersWithListInputHandler = rest.post('*/user/createWithList', function handler(req, res, ctx) {
  return res(ctx.json(createCreateUsersWithListInputMutationResponse()))
})
