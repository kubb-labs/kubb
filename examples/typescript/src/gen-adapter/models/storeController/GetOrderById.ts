import type { Order } from '../Order.ts'

export type GetOrderByIdOrderId = number

/**
 * @description successful operation
 */
export type GetOrderById200 = Order

export interface GetOrderByIdData {
  data?: never
  pathParams: {
    orderId: GetOrderByIdOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}

export interface GetOrderByIdResponses {
  '200': GetOrderById200
}

export type GetOrderByIdResponse = GetOrderById200
