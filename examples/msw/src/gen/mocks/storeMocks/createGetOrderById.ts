import { faker } from '@faker-js/faker'
import { createOrder } from '../createOrder'
import type { GetOrderById200, GetOrderById400, GetOrderById404, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../../models/GetOrderById'

/**
 * @description successful operation
 */
export function createGetOrderById200(override?: NonNullable<Partial<GetOrderById200>>): NonNullable<GetOrderById200> {
  return createOrder(override)
}

/**
 * @description Invalid ID supplied
 */
export function createGetOrderById400(override?: NonNullable<Partial<GetOrderById400>>): NonNullable<GetOrderById400> {
  return undefined
}

/**
 * @description Order not found
 */
export function createGetOrderById404(override?: NonNullable<Partial<GetOrderById404>>): NonNullable<GetOrderById404> {
  return undefined
}

export function createGetOrderByIdPathParams(override: NonNullable<Partial<GetOrderByIdPathParams>> = {}): NonNullable<GetOrderByIdPathParams> {
  return {
    ...{ 'orderId': faker.number.int() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createGetOrderByIdQueryResponse(override?: NonNullable<Partial<GetOrderByIdQueryResponse>>): NonNullable<GetOrderByIdQueryResponse> {
  return createOrder(override)
}
