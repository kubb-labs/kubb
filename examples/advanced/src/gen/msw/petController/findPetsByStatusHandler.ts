import { rest } from 'msw'

import { createFindPetsByStatusQueryResponse } from '../../mocks/petController/createFindPetsByStatus'

export const findPetsByStatusHandler = rest.get('*/pet/findByStatus', function handler(req, res, ctx) {
  return res(
    ctx.json(createFindPetsByStatusQueryResponse()),
  )
})
