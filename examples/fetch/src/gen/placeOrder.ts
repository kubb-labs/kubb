import client from '@kubb/plugin-client/clients/fetch'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getPlaceOrderUrl() {
  return '/store/order' as const
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrder(
  data?: PlaceOrderMutationRequest,
  config: Partial<RequestConfig<PlaceOrderMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, PlaceOrderMutationRequest>({
    method: 'POST',
    url: getPlaceOrderUrl().toString(),
    data,
    ...requestConfig,
  })
  return res.data
}
