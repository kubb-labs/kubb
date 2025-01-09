import client from '@kubb/plugin-client/clients/axios'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from './models/ts/storeController/DeleteOrder.js'
import type { GetInventoryQueryResponse } from './models/ts/storeController/GetInventory.js'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from './models/ts/storeController/GetOrderById.js'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from './models/ts/storeController/PlaceOrder.js'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from './models/ts/storeController/PlaceOrderPatch.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export function getGetInventoryUrlController() {
  return '/store/inventory' as const
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventoryController(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getGetInventoryUrlController().toString(),
    ...config,
  })
  return res.data
}

export function getPlaceOrderUrlController() {
  return '/store/order' as const
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderController(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
  const res = await client<PlaceOrderMutationResponse, ResponseErrorConfig<PlaceOrder405>, PlaceOrderMutationRequest>({
    method: 'POST',
    url: getPlaceOrderUrlController().toString(),
    data,
    ...config,
  })
  return res.data
}

export function getPlaceOrderPatchUrlController() {
  return '/store/order' as const
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchController(data?: PlaceOrderPatchMutationRequest, config: Partial<RequestConfig<PlaceOrderPatchMutationRequest>> = {}) {
  const res = await client<PlaceOrderPatchMutationResponse, ResponseErrorConfig<PlaceOrderPatch405>, PlaceOrderPatchMutationRequest>({
    method: 'PATCH',
    url: getPlaceOrderPatchUrlController().toString(),
    data,
    ...config,
  })
  return res.data
}

export function getGetOrderByIdUrlController(orderId: GetOrderByIdPathParams['orderId']) {
  return `/store/order/${orderId}` as const
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderByIdController(orderId: GetOrderByIdPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, unknown>({
    method: 'GET',
    url: getGetOrderByIdUrlController(orderId).toString(),
    ...config,
  })
  return res.data
}

export function getDeleteOrderUrlController(orderId: DeleteOrderPathParams['orderId']) {
  return `/store/order/${orderId}` as const
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrderController(orderId: DeleteOrderPathParams['orderId'], config: Partial<RequestConfig> = {}) {
  const res = await client<DeleteOrderMutationResponse, ResponseErrorConfig<DeleteOrder400 | DeleteOrder404>, unknown>({
    method: 'DELETE',
    url: getDeleteOrderUrlController(orderId).toString(),
    ...config,
  })
  return res.data
}

export function storeController() {
  return { getInventoryController, placeOrderController, placeOrderPatchController, getOrderByIdController, deleteOrderController }
}
