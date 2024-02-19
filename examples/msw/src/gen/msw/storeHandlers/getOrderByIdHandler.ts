import { rest } from 'msw'
import { createGetOrderByIdQueryResponse } from '../../mocks/storeMocks/createGetOrderById'

export const getOrderByIdHandler = rest.get('*/store/order/:orderId', function handler(req, res, ctx) {
  return res(
    ctx.json(createGetOrderByIdQueryResponse()),
  )
})
