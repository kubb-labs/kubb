import client from '../../../../client'

import type { DeleteOrderResponse, DeleteOrderPathParams } from '../../../models/ts/storeController/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function deleteOrder<TData = DeleteOrderResponse>(orderId: DeleteOrderPathParams['orderId']) {
  return client<TData>({
    method: 'delete',
    url: `/store/order/${orderId}`,
  })
}
