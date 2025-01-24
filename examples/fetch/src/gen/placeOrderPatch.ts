import client from '@kubb/plugin-client/clients/fetch'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getPlaceOrderPatchUrl() {
  return '/store/order' as const
}

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
    url: getPlaceOrderPatchUrl().toString(),
    data,
    ...requestConfig,
  })
  return res.data
}
