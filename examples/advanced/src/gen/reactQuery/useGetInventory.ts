import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetInventoryResponse, GetInventoryParams } from '../models/ts/GetInventory'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export const useGetInventory = (params: GetInventoryParams) => {
  return useQuery<GetInventoryResponse>({
    queryKey: ['useGetInventory'],
    queryFn: () => {
      const template = parseTemplate('/store/inventory').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
