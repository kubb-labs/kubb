import client from '../../../client'

import type { GetInventoryResponse } from '../../models/ts/GetInventory'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export const getInventory = <TData = GetInventoryResponse>() => {
  return client<TData>({
    method: 'get',
    url: `/store/inventory`,
  })
}
