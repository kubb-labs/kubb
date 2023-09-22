import { rest } from 'msw'
import { createUpdatepetwithformmutationresponse } from '../../mocks/petController/createUpdatepetwithform'

export const updatepetwithformHandler = rest.post('*/pet/:petId', function handler(req, res, ctx) {
  return res(ctx.json(createUpdatepetwithformmutationresponse()))
})
