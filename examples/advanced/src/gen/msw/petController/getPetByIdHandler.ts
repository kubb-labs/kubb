import { rest } from 'msw'
import { createGetpetbyidqueryresponse } from '../../mocks/petController/createGetpetbyid'

export const getpetbyidHandler = rest.get('*/pet/:petId', function handler(req, res, ctx) {
  return res(ctx.json(createGetpetbyidqueryresponse()))
})
