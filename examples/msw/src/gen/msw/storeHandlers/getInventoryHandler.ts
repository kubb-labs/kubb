import { rest } from 'msw'

import { createGetInventoryQueryResponse } from '../../mocks/storeMocks/createGetInventory'

export const getInventoryHandler = rest.get('*/store/inventory', function handler(req, res, ctx) {
  return res(
    ctx.json(createGetInventoryQueryResponse()),
  )
})
