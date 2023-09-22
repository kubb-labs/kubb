import { rest } from 'msw'
import { createCreatepetsmutationresponse, createCreatepetsmutationrequest } from '../../mocks/petsController/createCreatepets'

export const createpetsHandler = rest.post('*/pets/:uuid', function handler(req, res, ctx) {
  return res(ctx.json(createCreatepetsmutationresponse()))
})
