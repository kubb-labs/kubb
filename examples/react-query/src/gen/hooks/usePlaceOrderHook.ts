import client from '@kubb/plugin-client/client'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from '../models/PlaceOrder.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions, UseMutationResult, MutationKey } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const placeOrderMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderMutationKey = ReturnType<typeof placeOrderMutationKey>

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
async function placeOrder(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
  const res = await client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>({
    method: 'POST',
    url: '/store/order',
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
    mutation?: UseMutationOptions<
      PlaceOrderMutationResponse,
      PlaceOrder405,
      {
        data?: PlaceOrderMutationRequest
      }
    >
    client?: Partial<RequestConfig<PlaceOrderMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? placeOrderMutationKey()
  const mutation = useMutation({
    mutationFn: async ({
      data,
    }: {
      data?: PlaceOrderMutationRequest
    }) => {
      return placeOrder(data, config)
    },
    ...mutationOptions,
  }) as UseMutationResult<PlaceOrderMutationResponse, PlaceOrder405> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}
