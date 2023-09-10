import { rest } from 'msw'
import { createGetOrderByIdQueryResponse } from '../../mocks/storeMocks/createGetOrderById'

export const mockGetOrderByIdHandler = rest.get('*/store/order/:orderId', function handler(req, res, ctx) {
  return res(ctx.json(createGetOrderByIdQueryResponse()))
})
