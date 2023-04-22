import { useMutation } from '@tanstack/react-query'

import client from '../../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../../../models/ts/storeController/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function usePlaceOrder<TData = PlaceOrderMutationResponse, TError = PlaceOrder405, TVariables = PlaceOrderMutationRequest>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/store/order`,
        data,
      })
    },
    ...mutationOptions,
  })
}
