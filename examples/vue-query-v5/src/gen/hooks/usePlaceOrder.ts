import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { KubbQueryFactory } from './types'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'

type PlaceOrder = KubbQueryFactory<
  PlaceOrderMutationResponse,
  PlaceOrder405,
  PlaceOrderMutationRequest,
  never,
  never,
  never,
  PlaceOrderMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */

export function usePlaceOrder<TData = PlaceOrder['response'], TError = PlaceOrder['error']>(
  options: {
    mutation?: UseMutationOptions<TData, TError, PlaceOrder['request'], unknown>
    client?: PlaceOrder['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, PlaceOrder['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, PlaceOrder['request'], unknown>({
    mutationFn: (data) => {
      return client<PlaceOrder['data'], TError, PlaceOrder['request']>({
        method: 'post',
        url: `/store/order`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}
