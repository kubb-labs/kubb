import { faker } from '@faker-js/faker'

import { createOrder } from './createOrder'

import type { GetOrderById400, GetOrderById404, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../../models/GetOrderById'

/**
 * @description Invalid ID supplied
 */

export function createGetOrderById400(): GetOrderById400 {
  return undefined
}

/**
 * @description Order not found
 */

export function createGetOrderById404(): GetOrderById404 {
  return undefined
}

export function createGetOrderByIdPathParams(): GetOrderByIdPathParams {
  return { orderId: faker.number.float({}) }
}

/**
 * @description successful operation
 */

export function createGetOrderByIdQueryResponse(): GetOrderByIdQueryResponse {
  return createOrder()
}
