import type { Order } from '../models/Order.ts'
import { faker } from '@faker-js/faker'

export function createOrder(data: NonNullable<Partial<Order>> = {}) {
  faker.seed([220])
  return {
    ...{
      id: faker.number.int(),
      petId: faker.number.int(),
      quantity: faker.number.int(),
      shipDate: faker.date.anytime().toISOString(),
      status: faker.helpers.arrayElement<any>(['placed', 'approved', 'delivered']),
      http_status: faker.helpers.arrayElement<any>([200, 400, 500]),
      complete: faker.datatype.boolean(),
    },
    ...data,
  }
}
