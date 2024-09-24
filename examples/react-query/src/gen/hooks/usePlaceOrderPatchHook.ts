import client from '@kubb/plugin-client/client'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions, UseMutationResult, MutationKey } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const placeOrderPatchMutationKey = () => [{ url: '/store/order' }] as const

export type PlaceOrderPatchMutationKey = ReturnType<typeof placeOrderPatchMutationKey>

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
async function placeOrderPatch(data?: PlaceOrderPatchMutationRequest, config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> = {}) {
  const res = await client<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: '/store/order',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export function usePlaceOrderPatchHook(
  options: {
    mutation?: UseMutationOptions<
      PlaceOrderPatchMutationResponse,
      PlaceOrderPatch405,
      {
        data?: PlaceOrderPatchMutationRequest
      }
    >
    client?: Partial<RequestConfig<PlaceOrderPatchMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? placeOrderPatchMutationKey()
  const mutation = useMutation({
    mutationFn: async ({
      data,
    }: {
      data?: PlaceOrderPatchMutationRequest
    }) => {
      return placeOrderPatch(data, config)
    },
    ...mutationOptions,
  }) as UseMutationResult<PlaceOrderPatchMutationResponse, PlaceOrderPatch405> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}
