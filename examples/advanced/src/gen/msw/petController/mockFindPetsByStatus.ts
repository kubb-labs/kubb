import { rest } from 'msw'
import { createFindPetsByStatusQueryResponse } from '../../mocks/petController/createFindPetsByStatus'

export const mockFindPetsByStatusHandler = rest.get('*/pet/findByStatus', function handler(req, res, ctx) {
  return res(ctx.json(createFindPetsByStatusQueryResponse()))
})
