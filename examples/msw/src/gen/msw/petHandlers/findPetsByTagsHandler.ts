import { rest } from 'msw'
import { createFindPetsByTagsQueryResponse } from '../../mocks/petMocks/createFindPetsByTags'

export const findPetsByTagsHandler = rest.get('*/pet/findByTags', function handler(req, res, ctx) {
  return res(
    ctx.json(createFindPetsByTagsQueryResponse()),
  )
})
