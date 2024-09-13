import client from '@kubb/plugin-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from './models/ts/storeController/DeleteOrder.ts'
import type { GetInventoryQueryResponse } from './models/ts/storeController/GetInventory.ts'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from './models/ts/storeController/GetOrderById.ts'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from './models/ts/storeController/PlaceOrder.ts'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from './models/ts/storeController/PlaceOrderPatch.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export async function getInventoryController(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, unknown, unknown>({
    method: 'GET',
    url: '/store/inventory',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export async function placeOrderController(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
  const res = await client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>({
    method: 'POST',
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
export async function placeOrderPatchController(data?: PlaceOrderPatchMutationRequest, config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> = {}) {
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
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export async function getOrderByIdController(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, unknown>({
    method: 'GET',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export async function deleteOrderController(orderId: DeleteOrderPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, unknown>({
    method: 'DELETE',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return res.data
}
