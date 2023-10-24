import { rest } from 'msw'

import { createPlaceOrderPatchMutationResponse } from '../../mocks/storeMocks/createPlaceOrderPatch'

export const placeOrderPatchHandler = rest.patch('*/store/order', function handler(req, res, ctx) {
  return res(
    ctx.json(createPlaceOrderPatchMutationResponse()),
  )
})
