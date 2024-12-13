import client from '@kubb/plugin-client/clients/axios'
import useSWRMutation from 'swr/mutation'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'

export const placeOrderMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderMutationKey = ReturnType<typeof placeOrderMutationKey>

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
async function placeOrder(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
  const res = await client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>({ method: 'POST', url: '/store/order', data, ...config })
  return res.data
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export function usePlaceOrder(
  options: {
    mutation?: Parameters<typeof useSWRMutation<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationKey, PlaceOrderMutationRequest>>[2]
    client?: Partial<RequestConfig<PlaceOrderMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = placeOrderMutationKey()

  return useSWRMutation<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationKey | null, PlaceOrderMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return placeOrder(data, config)
    },
    mutationOptions,
  )
}
