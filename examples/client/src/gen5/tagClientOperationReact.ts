export const getInventory = {
  method: 'GET',
  url: '/store/inventory',
}

export const placeOrder = {
  method: 'POST',
  url: '/store/order',
}

export const placeOrderPatch = {
  method: 'PATCH',
  url: '/store/order',
}

export const getOrderById = {
  method: 'GET',
  url: '/store/order/:orderId',
}

export const deleteOrder = {
  method: 'DELETE',
  url: '/store/order/:orderId',
}
