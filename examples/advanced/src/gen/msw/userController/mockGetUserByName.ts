import { rest } from 'msw'
import { createGetUserByNameQueryResponse } from '../../mocks/userController/createGetUserByName'

export const mockGetUserByNameHandler = rest.get('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createGetUserByNameQueryResponse()))
})
