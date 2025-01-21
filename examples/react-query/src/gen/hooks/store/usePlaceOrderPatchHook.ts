import client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../../models/PlaceOrderPatch.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const placeOrderPatchMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderPatchMutationKey = ReturnType<typeof placeOrderPatchMutationKey>

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHook(data?: PlaceOrderPatchMutationRequest, config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> = {}) {
  const res = await client<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: '/store/order',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export function usePlaceOrderPatchHook(
  options: {
    mutation?: UseMutationOptions<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, { data?: PlaceOrderPatchMutationRequest }>
    client?: Partial<RequestConfig<PlaceOrderPatchMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? placeOrderPatchMutationKey()

  return useMutation<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, { data?: PlaceOrderPatchMutationRequest }>({
    mutationFn: async ({ data }) => {
      return placeOrderPatchHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
