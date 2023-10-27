import { rest } from 'msw'
import { createLoginUserQueryResponse } from '../../mocks/userMocks/createLoginUser'

export const loginUserHandler = rest.get('*/user/login', function handler(req, res, ctx) {
  return res(
    ctx.json(createLoginUserQueryResponse()),
  )
})
