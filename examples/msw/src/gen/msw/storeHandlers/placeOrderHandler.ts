import { createPlaceOrderMutationResponse } from '../../mocks/storeMocks/createPlaceOrder.ts'
import { http } from 'msw'

export const placeOrderHandler = http.post('*/store/order', function handler(info) {
  return new Response(JSON.stringify(createPlaceOrderMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
