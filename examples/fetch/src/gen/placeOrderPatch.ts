import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from './models.ts'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export async function placeOrderPatch(
  data?: PlaceOrderPatchMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<PlaceOrderPatchMutationResponse>['data']> {
  const res = await client<PlaceOrderPatchMutationResponse, PlaceOrderPatchMutationRequest>({
    method: 'patch',
    url: '/store/order',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...options,
  })
  return res.data
}
