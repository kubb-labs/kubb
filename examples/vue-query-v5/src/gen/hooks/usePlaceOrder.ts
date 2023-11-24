import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'

type PlaceOrderClient = typeof client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>
type PlaceOrder = {
  data: PlaceOrderMutationResponse
  error: PlaceOrder405
  request: PlaceOrderMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<PlaceOrderClient>>['data']
  unionResponse: Awaited<ReturnType<PlaceOrderClient>> | Awaited<ReturnType<PlaceOrderClient>>['data']
  client: {
    paramaters: Partial<Parameters<PlaceOrderClient>[0]>
    return: Awaited<ReturnType<PlaceOrderClient>>
  }
}
/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order */
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
