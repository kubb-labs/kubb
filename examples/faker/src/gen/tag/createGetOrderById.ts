import type { GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../models/GetOrderById.ts'
import { createOrder } from './createOrder.ts'
import { faker } from '@faker-js/faker'

export function createGetOrderByIdPathParams(data?: Partial<GetOrderByIdPathParams>) {
  return {
    ...{ orderId: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetOrderById200() {
  return createOrder()
}

/**
 * @description Invalid ID supplied
 */
export function createGetOrderById400() {
  return undefined
}

/**
 * @description Order not found
 */
export function createGetOrderById404() {
  return undefined
}

export function createGetOrderByIdQueryResponse(data?: Partial<GetOrderByIdQueryResponse>) {
  return data || faker.helpers.arrayElement<any>([createGetOrderById200()])
}
