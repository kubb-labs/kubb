import client from '@kubb/plugin-client/clients/axios'
import useSWRMutation from 'swr/mutation'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

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
export function usePlaceOrderPatch(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        PlaceOrderPatchMutationResponse,
        ResponseErrorConfig<PlaceOrderPatch405>,
        PlaceOrderPatchMutationKey,
        PlaceOrderPatchMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = placeOrderPatchMutationKey()

  return useSWRMutation<
    PlaceOrderPatchMutationResponse,
    ResponseErrorConfig<PlaceOrderPatch405>,
    PlaceOrderPatchMutationKey | null,
    PlaceOrderPatchMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return placeOrderPatch(data, config)
    },
    mutationOptions,
  )
}
