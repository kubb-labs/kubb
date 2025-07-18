/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import client from '@/lib/axios-client'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../../types/storeApi/PlaceOrderPatch.ts'
import type { RequestConfig, ResponseErrorConfig } from '@/lib/axios-client'

export function getPlaceOrderPatchUrl() {
  return '/store/order' as const
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatch(
  { data }: { data?: PlaceOrderPatchMutationRequest },
  config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: getPlaceOrderPatchUrl().toString(),
    data,
    ...requestConfig,
  })
  return res.data
}
