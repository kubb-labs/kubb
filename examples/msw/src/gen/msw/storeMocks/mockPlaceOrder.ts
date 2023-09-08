import { rest } from 'msw'
import { createPlaceOrderMutationResponse, createPlaceOrderMutationRequest } from '../../mocks/storeMocks/createPlaceOrder'

export const mockPlaceOrderHandler = rest.get('*/store/order', function handler(req, res, ctx) {
  return res(ctx.json(createPlaceOrderMutationResponse()))
})
