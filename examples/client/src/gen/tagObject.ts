import client from '@kubb/plugin-client/clients/axios'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from './models/ts/storeController/DeleteOrder.js'
import type { GetInventoryQueryResponse } from './models/ts/storeController/GetInventory.js'
import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams, GetOrderById400, GetOrderById404 } from './models/ts/storeController/GetOrderById.js'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from './models/ts/storeController/PlaceOrder.js'
import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse, PlaceOrderPatch405 } from './models/ts/storeController/PlaceOrderPatch.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventory(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetInventoryQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: '/store/inventory', ...requestConfig })
  return res
}

getInventory.method = 'get' as const
getInventory.url = '/store/inventory' as const
getInventory.operationId = 'getInventory' as const
getInventory.request = {} as never
getInventory.response = {} as GetInventoryQueryResponse
getInventory.pathParams = {} as never
getInventory.queryParams = {} as never

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
    url: '/store/order',
    data,
    ...requestConfig,
  })
  return res
}

placeOrder.method = 'post' as const
placeOrder.url = '/store/order' as const
placeOrder.operationId = 'placeOrder' as const
placeOrder.request = {} as PlaceOrderMutationRequest
placeOrder.response = {} as PlaceOrderMutationResponse
placeOrder.pathParams = {} as never
placeOrder.queryParams = {} as never

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
  return res
}

placeOrderPatch.method = 'patch' as const
placeOrderPatch.url = '/store/order' as const
placeOrderPatch.operationId = 'placeOrderPatch' as const
placeOrderPatch.request = {} as PlaceOrderPatchMutationRequest
placeOrderPatch.response = {} as PlaceOrderPatchMutationResponse
placeOrderPatch.pathParams = {} as never
placeOrderPatch.queryParams = {} as never

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderById(
  { orderId }: { orderId: GetOrderByIdPathParams['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetOrderByIdQueryResponse, ResponseErrorConfig<GetOrderById400 | GetOrderById404>, unknown>({
    method: 'GET',
    url: `/store/order/${orderId}`,
    ...requestConfig,
  })
  return res
}

getOrderById.method = 'get' as const
getOrderById.url = '/store/order/:orderId' as const
getOrderById.operationId = 'getOrderById' as const
getOrderById.request = {} as never
getOrderById.response = {} as GetOrderByIdQueryResponse
getOrderById.pathParams = {} as GetOrderByIdPathParams
getOrderById.queryParams = {} as never

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrder(
  { orderId }: { orderId: DeleteOrderPathParams['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeleteOrderMutationResponse, ResponseErrorConfig<DeleteOrder400 | DeleteOrder404>, unknown>({
    method: 'DELETE',
    url: `/store/order/${orderId}`,
    ...requestConfig,
  })
  return res
}

deleteOrder.method = 'delete' as const
deleteOrder.url = '/store/order/:orderId' as const
deleteOrder.operationId = 'deleteOrder' as const
deleteOrder.request = {} as never
deleteOrder.response = {} as DeleteOrderMutationResponse
deleteOrder.pathParams = {} as DeleteOrderPathParams
deleteOrder.queryParams = {} as never
