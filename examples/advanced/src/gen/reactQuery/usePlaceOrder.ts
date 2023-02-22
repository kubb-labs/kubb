import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { PlaceOrderRequest, PlaceOrderResponse } from '../models/ts/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export const usePlaceOrder = <TData = PlaceOrderResponse, TVariables = PlaceOrderRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.post('/store/order', data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}
