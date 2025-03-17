import client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const placeOrderPatchMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderPatchMutationKey = ReturnType<typeof placeOrderPatchMutationKey>

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatch(
  data?: PlaceOrderPatchMutationRequest,
  config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: '/store/order',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export function createPlaceOrderPatch<TContext>(
  options: {
    mutation?: CreateMutationOptions<
      PlaceOrderPatchMutationResponse,
      ResponseErrorConfig<PlaceOrderPatch405>,
      { data?: PlaceOrderPatchMutationRequest },
      TContext
    >
    client?: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? placeOrderPatchMutationKey()

  return createMutation<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, { data?: PlaceOrderPatchMutationRequest }, TContext>({
    mutationFn: async ({ data }) => {
      return placeOrderPatch(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
