import client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const placeOrderMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderMutationKey = ReturnType<typeof placeOrderMutationKey>

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrder(
  data?: PlaceOrderMutationRequest,
  options: Partial<RequestConfig<PlaceOrderMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: fetcher = client, ...config } = options

  const res = await fetcher<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, PlaceOrderMutationRequest>({
    method: 'POST',
    url: '/store/order',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export function createPlaceOrder(
  options: {
    mutation?: CreateMutationOptions<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, { data?: PlaceOrderMutationRequest }>
    client?: Partial<RequestConfig<PlaceOrderMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? placeOrderMutationKey()

  return createMutation<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, { data?: PlaceOrderMutationRequest }>({
    mutationFn: async ({ data }) => {
      return placeOrder(data, options)
    },
    mutationKey,
    ...mutationOptions,
  })
}
