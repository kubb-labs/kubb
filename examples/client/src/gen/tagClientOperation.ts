export const getInventory = {
            method: 'get',
            url: '/store/inventory'
          }
        


          export const placeOrder = {
            method: 'post',
            url: '/store/order'
          }
        


          export const placeOrderPatch = {
            method: 'patch',
            url: '/store/order'
          }
        


          export const getOrderById = {
            method: 'get',
            url: '/store/order/:orderId'
          }
        


          export const deleteOrder = {
            method: 'delete',
            url: '/store/order/:orderId'
          }