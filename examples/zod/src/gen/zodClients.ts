import client from '@kubb/plugin-client/client'
import type { DeleteOrderMutationResponseType, DeleteOrderPathParamsType, DeleteOrder400Type, DeleteOrder404Type } from './ts/DeleteOrderType.ts'
import type { GetInventoryQueryResponseType } from './ts/GetInventoryType.ts'
import type { GetOrderByIdQueryResponseType, GetOrderByIdPathParamsType, GetOrderById400Type, GetOrderById404Type } from './ts/GetOrderByIdType.ts'
import type { PlaceOrderPatchMutationRequestType, PlaceOrderPatchMutationResponseType, PlaceOrderPatch405Type } from './ts/PlaceOrderPatchType.ts'
import type { PlaceOrderMutationRequestType, PlaceOrderMutationResponseType, PlaceOrder405Type } from './ts/PlaceOrderType.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import { deleteOrderMutationResponseSchema } from './zod/deleteOrderSchema.gen.ts'
import { getInventoryQueryResponseSchema } from './zod/getInventorySchema.gen.ts'
import { getOrderByIdQueryResponseSchema } from './zod/getOrderByIdSchema.gen.ts'
import { placeOrderPatchMutationResponseSchema } from './zod/placeOrderPatchSchema.gen.ts'
import { placeOrderMutationResponseSchema } from './zod/placeOrderSchema.gen.ts'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export async function getInventory(config: Partial<RequestConfig> = {}) {
  const res = await client<GetInventoryQueryResponseType, unknown, unknown>({
    method: 'get',
    url: '/store/inventory',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return getInventoryQueryResponseSchema.parse(res.data)
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export async function placeOrder(data?: PlaceOrderMutationRequestType, config: Partial<RequestConfig<PlaceOrderMutationRequestType>> = {}) {
  const res = await client<PlaceOrderMutationResponseType, PlaceOrder405Type, PlaceOrderMutationRequestType>({
    method: 'post',
    url: '/store/order',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return placeOrderMutationResponseSchema.parse(res.data)
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export async function placeOrderPatch(data?: PlaceOrderPatchMutationRequestType, config: Partial<RequestConfig<PlaceOrderPatchMutationRequestType>> = {}) {
  const res = await client<PlaceOrderPatchMutationResponseType, PlaceOrderPatch405Type, PlaceOrderPatchMutationRequestType>({
    method: 'patch',
    url: '/store/order',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return placeOrderPatchMutationResponseSchema.parse(res.data)
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
export async function getOrderById(
  {
    orderId,
  }: {
    orderId: GetOrderByIdPathParamsType['orderId']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<GetOrderByIdQueryResponseType, GetOrderById400Type | GetOrderById404Type, unknown>({
    method: 'get',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return getOrderByIdQueryResponseSchema.parse(res.data)
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export async function deleteOrder(
  {
    orderId,
  }: {
    orderId: DeleteOrderPathParamsType['orderId']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<DeleteOrderMutationResponseType, DeleteOrder400Type | DeleteOrder404Type, unknown>({
    method: 'delete',
    url: `/store/order/${orderId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return deleteOrderMutationResponseSchema.parse(res.data)
}
