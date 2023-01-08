import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetStoreOrderResponse, GetStoreOrderParams } from './models/GetStoreOrder'

/**
 * @link /store/order
 */
export const useGetStoreOrder = (params: GetStoreOrderParams) => {
  return useQuery<GetStoreOrderResponse>({
    queryKey: ['useGetStoreOrder'],
    queryFn: () => {
      const template = parseTemplate('/store/order').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
