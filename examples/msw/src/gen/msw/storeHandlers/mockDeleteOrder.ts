import { rest } from 'msw'
import { createDeleteOrderMutationResponse } from '../../mocks/storeMocks/createDeleteOrder'

export const mockDeleteOrderHandler = rest.get('*/store/order/:orderId', function handler(req, res, ctx) {
  return res(ctx.json(createDeleteOrderMutationResponse()))
})
