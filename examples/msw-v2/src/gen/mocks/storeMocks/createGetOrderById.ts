import { faker } from '@faker-js/faker'
import { createOrder } from '../createOrder'
import type { GetOrderById400, GetOrderById404, GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../../models/GetOrderById'

/**
 * @description Invalid ID supplied
 */

export function createGetOrderById400(): NonNullable<GetOrderById400> {
  faker.seed([220])
  return undefined
}
/**
 * @description Order not found
 */

export function createGetOrderById404(): NonNullable<GetOrderById404> {
  faker.seed([220])
  return undefined
}

export function createGetOrderByIdPathParams(): NonNullable<GetOrderByIdPathParams> {
  faker.seed([220])
  return { 'orderId': faker.number.float({}) }
}
/**
 * @description successful operation
 */

export function createGetOrderByIdQueryResponse(): NonNullable<GetOrderByIdQueryResponse> {
  faker.seed([220])
  return createOrder()
}
