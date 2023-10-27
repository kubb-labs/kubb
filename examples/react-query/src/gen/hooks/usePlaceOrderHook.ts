import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'

type PlaceOrder = KubbQueryFactory<PlaceOrderMutationResponse, PlaceOrder405, never, never, never, PlaceOrderMutationResponse, {
  dataReturnType: 'data'
  type: 'mutation'
}> /**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */

export function usePlaceOrderHook<TData = PlaceOrder['response'], TError = PlaceOrder['error'], TVariables = PlaceOrder['request']>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: PlaceOrder['client']['paramaters']
} = {}): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/store/order`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
