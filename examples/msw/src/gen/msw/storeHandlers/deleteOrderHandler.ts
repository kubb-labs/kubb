import { createDeleteOrderMutationResponse } from '../../mocks/storeMocks/createDeleteOrder.ts'
import { http } from 'msw'

export const deleteOrderHandler = http.delete('*/store/order/:orderId', function handler(info) {
  return new Response(JSON.stringify(createDeleteOrderMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
