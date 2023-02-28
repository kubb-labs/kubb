import client from '../../../client'

import type { GetOrderByIdResponse, GetOrderByIdPathParams, GetOrderByIdQueryParams } from '../../models/ts/GetOrderById'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/{orderId}
 * @deprecated
 */
export const getOrderById = <TData = GetOrderByIdResponse>(orderId: GetOrderByIdPathParams['orderId'], params?: GetOrderByIdQueryParams) => {
  return client<TData>({
    method: 'get',
    url: `/store/order/${orderId}`,
    params,
  })
}
