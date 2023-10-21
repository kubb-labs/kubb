import { rest } from 'msw'
import { createDeleteOrderMutationResponse } from '../../mocks/storeMocks/createDeleteOrder'

export const deleteOrderHandler = rest.delete('*/store/order/:orderId', function handler(req, res, ctx) {
  return res(
    ctx.json(createDeleteOrderMutationResponse()),
  )
})
