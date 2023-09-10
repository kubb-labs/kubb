import { rest } from 'msw'
import { createDeleteOrderMutationResponse } from '../../mocks/storeMocks/createDeleteOrder'

export const deleteOrderHandler = rest.get('*/store/order/:orderId', function handler(req, res, ctx) {
  return res(ctx.json(createDeleteOrderMutationResponse()))
})
