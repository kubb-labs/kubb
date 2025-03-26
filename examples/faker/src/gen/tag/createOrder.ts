import type { Order } from '../models/Order.ts'
import { faker } from '@faker-js/faker'

export function createOrder(data?: Partial<Order>): Order {
  return {
    ...{
      id: faker.number.int(),
      petId: faker.number.int(),
      quantity: faker.number.int(),
      shipDateTime: faker.date.anytime().toISOString(),
      shipDate: faker.date.anytime().toISOString().substring(0, 10),
      shipTime: faker.date.anytime().toISOString().substring(11, 23),
      status: faker.helpers.arrayElement<any>(['placed', 'approved', 'delivered']),
      complete: faker.datatype.boolean(),
    },
    ...(data || {}),
  }
}
