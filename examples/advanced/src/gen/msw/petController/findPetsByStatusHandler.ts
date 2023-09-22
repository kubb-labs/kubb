import { rest } from 'msw'
import { createFindpetsbystatusqueryresponse } from '../../mocks/petController/createFindpetsbystatus'

export const findpetsbystatusHandler = rest.get('*/pet/findByStatus', function handler(req, res, ctx) {
  return res(ctx.json(createFindpetsbystatusqueryresponse()))
})
