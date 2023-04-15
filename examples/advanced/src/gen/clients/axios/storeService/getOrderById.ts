import client from '../../../../client'

import type { GetOrderByIdResponse, GetOrderByIdPathParams } from '../../../models/ts/storeController/GetOrderById'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export function getOrderById<TData = GetOrderByIdResponse>(orderId: GetOrderByIdPathParams['orderId']) {
  return client<TData>({
    method: 'get',
    url: `/store/order/${orderId}`,
  })
}
