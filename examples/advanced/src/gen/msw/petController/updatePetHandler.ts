import { rest } from 'msw'
import { createUpdatepetmutationresponse, createUpdatepetmutationrequest } from '../../mocks/petController/createUpdatepet'

export const updatepetHandler = rest.put('*/pet', function handler(req, res, ctx) {
  return res(ctx.json(createUpdatepetmutationresponse()))
})
