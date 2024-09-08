import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/PlaceOrderPatch.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
async function placeOrderPatch(data?: PlaceOrderPatchMutationRequest, config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> = {}) {
  const res = await client<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, PlaceOrderPatchMutationRequest>({
    method: 'patch',
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
export function usePlaceOrderPatch(
  options: {
    mutation?: SWRMutationConfiguration<PlaceOrderPatchMutationResponse, PlaceOrderPatch405>
    client?: Partial<RequestConfig<PlaceOrderPatchMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/store/order'] as const
  return useSWRMutation<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return placeOrderPatch(data, config)
    },
    mutationOptions,
  )
}
