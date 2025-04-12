import client from '@kubb/plugin-client/clients/axios'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from '../models/ts/PlaceOrderPatch.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

function getPlaceOrderPatchUrl() {
  return 'https://petstore.swagger.io/v2/store/order' as const
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
