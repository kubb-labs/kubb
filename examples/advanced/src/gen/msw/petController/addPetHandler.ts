import { rest } from 'msw'
import { createAddpetmutationresponse, createAddpetmutationrequest } from '../../mocks/petController/createAddpet'

export const addpetHandler = rest.post('*/pet', function handler(req, res, ctx) {
  return res(ctx.json(createAddpetmutationresponse()))
})
