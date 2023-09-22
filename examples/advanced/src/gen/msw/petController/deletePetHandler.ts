import { rest } from 'msw'
import { createDeletepetmutationresponse } from '../../mocks/petController/createDeletepet'

export const deletepetHandler = rest.delete('*/pet/:petId', function handler(req, res, ctx) {
  return res(ctx.json(createDeletepetmutationresponse()))
})
