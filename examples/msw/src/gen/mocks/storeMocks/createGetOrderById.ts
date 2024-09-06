import type { GetOrderByIdPathParams, GetOrderById200, GetOrderById400, GetOrderById404, GetOrderByIdQueryResponse } from '../../models/GetOrderById.ts'
import { createOrder } from '../createOrder.ts'
import { faker } from '@faker-js/faker'

export function createGetOrderByIdPathParams(data: NonNullable<Partial<GetOrderByIdPathParams>> = {}): NonNullable<GetOrderByIdPathParams> {
  faker.seed([220])
  return {
    ...{ orderId: faker.number.int() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetOrderById200(): NonNullable<GetOrderById200> {
  faker.seed([220])
  return createOrder()
}

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

/**
 * @description successful operation
 */
export function createGetOrderByIdQueryResponse(): NonNullable<GetOrderByIdQueryResponse> {
  faker.seed([220])
  return createOrder()
}
