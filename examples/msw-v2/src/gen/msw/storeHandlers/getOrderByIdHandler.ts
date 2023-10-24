import { http } from 'msw'

import { createGetOrderByIdQueryResponse } from '../../mocks/storeMocks/createGetOrderById'

export const getOrderByIdHandler = http.get('*/store/order/:orderId', function handler(info) {
  return new Response(JSON.stringify(createGetOrderByIdQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
