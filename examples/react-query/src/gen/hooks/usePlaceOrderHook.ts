import client from '@kubb/plugin-client/client'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
async function placeOrder(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
  const res = await client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>({
    method: 'post',
    url: `/store/order`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function usePlaceOrderHook(
  options: {
    mutation?: UseMutationOptions<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>
    client?: Partial<RequestConfig<PlaceOrderMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      return placeOrder(data, config)
    },
    ...mutationOptions,
  })
}
