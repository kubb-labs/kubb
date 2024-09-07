import client from '@kubb/plugin-client/client'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

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
export function usePlaceOrderHook(options?: {
  mutation?: UseMutationOptions<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']>
  client?: PlaceOrder['client']['parameters']
}) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<PlaceOrder['data'], PlaceOrder['error']>({ method: 'post', url: '/store/order', data, ...options })
      return res.data
    },
    ...mutationOptions,
  })
}
