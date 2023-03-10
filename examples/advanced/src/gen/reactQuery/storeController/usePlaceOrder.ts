import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { PlaceOrderRequest, PlaceOrderResponse } from '../../models/ts/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 * @deprecated
 */
export function usePlaceOrder<TData = PlaceOrderResponse, TVariables = PlaceOrderRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/store/order`,
        data,
      })
    },
    ...mutationOptions,
  })
}
