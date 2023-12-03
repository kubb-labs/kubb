import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

type PlaceOrderClient = typeof client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>
type PlaceOrder = {
  data: PlaceOrderMutationResponse
  error: PlaceOrder405
  request: PlaceOrderMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: PlaceOrderMutationResponse
  unionResponse: Awaited<ReturnType<PlaceOrderClient>> | PlaceOrderMutationResponse
  client: {
    paramaters: Partial<Parameters<PlaceOrderClient>[0]>
    return: Awaited<ReturnType<PlaceOrderClient>>
  }
}
/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order */
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
