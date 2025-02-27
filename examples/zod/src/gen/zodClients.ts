import client from '@kubb/plugin-client/clients/axios'
import type { DeleteOrderMutationResponseType, DeleteOrderPathParamsType, DeleteOrder400Type, DeleteOrder404Type } from './ts/DeleteOrderType.ts'
import type { GetInventoryQueryResponseType } from './ts/GetInventoryType.ts'
import type { GetOrderByIdQueryResponseType, GetOrderByIdPathParamsType, GetOrderById400Type, GetOrderById404Type } from './ts/GetOrderByIdType.ts'
import type { PlaceOrderPatchMutationRequestType, PlaceOrderPatchMutationResponseType, PlaceOrderPatch405Type } from './ts/PlaceOrderPatchType.ts'
import type { PlaceOrderMutationRequestType, PlaceOrderMutationResponseType, PlaceOrder405Type } from './ts/PlaceOrderType.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import { deleteOrderMutationResponseSchema } from './zod/deleteOrderSchema.gen.ts'
import { getInventoryQueryResponseSchema } from './zod/getInventorySchema.gen.ts'
import { getOrderByIdQueryResponseSchema } from './zod/getOrderByIdSchema.gen.ts'
import { placeOrderPatchMutationResponseSchema, placeOrderPatchMutationRequestSchema } from './zod/placeOrderPatchSchema.gen.ts'
import { placeOrderMutationResponseSchema, placeOrderMutationRequestSchema } from './zod/placeOrderSchema.gen.ts'

export function getGetInventoryUrl() {
  return '/store/inventory' as const
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventory(config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetInventoryQueryResponseType, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getGetInventoryUrl().toString(),
    ...requestConfig,
  })
  return getInventoryQueryResponseSchema.parse(res.data)
}

export function getPlaceOrderUrl() {
  return '/store/order' as const
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrder(
  data?: PlaceOrderMutationRequestType,
  config: Partial<RequestConfig<PlaceOrderMutationRequestType>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<PlaceOrderMutationResponseType, ResponseErrorConfig<PlaceOrder405Type>, PlaceOrderMutationRequestType>({
    method: 'POST',
    url: getPlaceOrderUrl().toString(),
    data: placeOrderMutationRequestSchema.parse(data),
    ...requestConfig,
  })
  return placeOrderMutationResponseSchema.parse(res.data)
}

export function getPlaceOrderPatchUrl() {
  return '/store/order' as const
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatch(
  data?: PlaceOrderPatchMutationRequestType,
  config: Partial<RequestConfig<PlaceOrderPatchMutationRequestType>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<PlaceOrderPatchMutationResponseType, ResponseErrorConfig<PlaceOrderPatch405Type>, PlaceOrderPatchMutationRequestType>({
    method: 'PATCH',
    url: getPlaceOrderPatchUrl().toString(),
    data: placeOrderPatchMutationRequestSchema.parse(data),
    ...requestConfig,
  })
  return placeOrderPatchMutationResponseSchema.parse(res.data)
}

export function getGetOrderByIdUrl({ orderId }: { orderId: GetOrderByIdPathParamsType['orderId'] }) {
  return `/store/order/${orderId}` as const
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderById(
  { orderId }: { orderId: GetOrderByIdPathParamsType['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetOrderByIdQueryResponseType, ResponseErrorConfig<GetOrderById400Type | GetOrderById404Type>, unknown>({
    method: 'GET',
    url: getGetOrderByIdUrl({ orderId }).toString(),
    ...requestConfig,
  })
  return getOrderByIdQueryResponseSchema.parse(res.data)
}

export function getDeleteOrderUrl({ orderId }: { orderId: DeleteOrderPathParamsType['orderId'] }) {
  return `/store/order/${orderId}` as const
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrder(
  { orderId }: { orderId: DeleteOrderPathParamsType['orderId'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeleteOrderMutationResponseType, ResponseErrorConfig<DeleteOrder400Type | DeleteOrder404Type>, unknown>({
    method: 'DELETE',
    url: getDeleteOrderUrl({ orderId }).toString(),
    ...requestConfig,
  })
  return deleteOrderMutationResponseSchema.parse(res.data)
}
