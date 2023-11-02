import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'

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

export function placeOrderQuery<TData = PlaceOrder['response'], TError = PlaceOrder['error']>(
  options: {
    mutation?: CreateMutationOptions<TData, TError, PlaceOrder['request']>
    client?: PlaceOrder['client']['paramaters']
  } = {},
): CreateMutationResult<TData, TError, PlaceOrder['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<TData, TError, PlaceOrder['request']>({
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
