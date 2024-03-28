import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../models/PlaceOrder'

type PlaceOrderClient = typeof client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>
type PlaceOrder = {
  data: PlaceOrderMutationResponse
  error: PlaceOrder405
  request: PlaceOrderMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: PlaceOrderMutationResponse
  client: {
    parameters: Partial<Parameters<PlaceOrderClient>[0]>
    return: Awaited<ReturnType<PlaceOrderClient>>
  }
}
/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function placeOrderQuery(
  options: {
    mutation?: CreateMutationOptions<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']>
    client?: PlaceOrder['client']['parameters']
  } = {},
): CreateMutationResult<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']>({
    mutationFn: async (data) => {
      const res = await client<PlaceOrder['data'], PlaceOrder['error'], PlaceOrder['request']>({
        method: 'post',
        url: '/store/order',
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
