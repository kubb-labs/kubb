import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { DeleteOrderRequest, DeleteOrderResponse } from '../models/ts/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/{orderId}
 */
export const useDeleteOrder = () => {
  return useMutation<DeleteOrderResponse, unknown, DeleteOrderRequest>({
    mutationFn: (data) => {
      return axios.delete('/store/order/{orderId}').then((res) => res.data)
    },
  })
}
