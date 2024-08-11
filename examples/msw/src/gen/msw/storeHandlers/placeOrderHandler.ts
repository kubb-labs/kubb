import { http } from 'msw'
import { createPlaceOrderMutationResponse } from '../../mocks/storeMocks/createPlaceOrder'

export const placeOrderHandler = http.post('*/store/order', function handler(info) {
  return new Response(JSON.stringify(createPlaceOrderMutationResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
