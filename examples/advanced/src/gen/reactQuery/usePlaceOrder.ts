import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PlaceOrderRequest, PlaceOrderResponse } from './models/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export const usePlaceOrder = () => {
  return useMutation<PlaceOrderResponse, unknown, PlaceOrderRequest>({
    mutationFn: (data) => {
      return axios.post('/store/order', data).then((res) => res.data)
    },
  })
}
