import client from '../../../client'

import type { DeleteOrderRequest, DeleteOrderResponse, DeleteOrderPathParams } from '../../models/ts/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/{orderId}
 */
export function deleteOrder<TData = DeleteOrderResponse, TVariables = DeleteOrderRequest>(orderId: DeleteOrderPathParams['orderId']) {
  return client<TData, TVariables>({
    method: 'delete',
    url: `/store/order/${orderId}`,
  })
}
