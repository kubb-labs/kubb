import { rest } from 'msw'
import { createDeleteusermutationresponse } from '../../mocks/userController/createDeleteuser'

export const deleteuserHandler = rest.delete('*/user/:username', function handler(req, res, ctx) {
  return res(ctx.json(createDeleteusermutationresponse()))
})
