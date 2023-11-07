import { rest } from 'msw'
import { createPlaceOrderMutationResponse } from '../../mocks/storeMocks/createPlaceOrder'

export const placeOrderHandler = rest.post('*/store/order', function handler(req, res, ctx) {
  return res(ctx.json(createPlaceOrderMutationResponse()))
})
