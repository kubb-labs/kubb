import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { GetInventoryResponse } from '../models/ts/GetInventory'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export const useGetInventory = () => {
  return useQuery<GetInventoryResponse>({
    queryKey: ['useGetInventory'],
    queryFn: () => {
      return axios.get('/store/inventory').then((res) => res.data)
    },
  })
}
