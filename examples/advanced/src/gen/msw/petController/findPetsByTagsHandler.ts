import { rest } from 'msw'
import { createFindpetsbytagsqueryresponse } from '../../mocks/petController/createFindpetsbytags'

export const findpetsbytagsHandler = rest.get('*/pet/findByTags', function handler(req, res, ctx) {
  return res(ctx.json(createFindpetsbytagsqueryresponse()))
})
