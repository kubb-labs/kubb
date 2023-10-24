import { http } from 'msw'

import { createDeleteOrderMutationResponse } from '../../mocks/storeMocks/createDeleteOrder'

export const deleteOrderHandler = http.delete('*/store/order/:orderId', function handler(info) {
  return new Response(JSON.stringify(createDeleteOrderMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
