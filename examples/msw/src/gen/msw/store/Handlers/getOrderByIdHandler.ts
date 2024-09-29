import { createGetOrderByIdQueryResponse } from '../../../mocks/storeController/createGetOrderById.ts'
import { http } from 'msw'

export const getOrderByIdHandler = http.get('*/store/order/:orderId', function handler(info) {
  return new Response(JSON.stringify(createGetOrderByIdQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
