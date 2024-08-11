import { http } from 'msw'
import { createGetInventoryQueryResponse } from '../../mocks/storeMocks/createGetInventory'

export const getInventoryHandler = http.get('*/store/inventory', function handler(info) {
  return new Response(JSON.stringify(createGetInventoryQueryResponse()), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
})
