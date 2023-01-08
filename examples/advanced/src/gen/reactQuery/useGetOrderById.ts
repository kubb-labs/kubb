import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetOrderByIdResponse, GetOrderByIdParams } from './models/GetOrderById'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/{orderId}
 */
export const useGetOrderById = (params: GetOrderByIdParams) => {
  return useQuery<GetOrderByIdResponse>({
    queryKey: ['useGetOrderById'],
    queryFn: () => {
      const template = parseTemplate('/store/order/{orderId}').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
