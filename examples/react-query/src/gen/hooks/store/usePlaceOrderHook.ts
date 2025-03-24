import client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../../models/PlaceOrder.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const placeOrderMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderMutationKey = ReturnType<typeof placeOrderMutationKey>

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderHook(
  data?: PlaceOrderMutationRequest,
  config: Partial<RequestConfig<PlaceOrderMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, PlaceOrderMutationRequest>({
    method: 'POST',
    url: '/store/order',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export function usePlaceOrderHook<TContext>(
  options: {
    mutation?: UseMutationOptions<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, { data?: PlaceOrderMutationRequest }, TContext>
    client?: Partial<RequestConfig<PlaceOrderMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? placeOrderMutationKey()

  return useMutation<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, { data?: PlaceOrderMutationRequest }, TContext>({
    mutationFn: async ({ data }) => {
      return placeOrderHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
