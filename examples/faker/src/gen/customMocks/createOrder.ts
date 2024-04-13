import { faker } from '@faker-js/faker'
import type { Order } from '../models/Order'

export function createOrder(data: NonNullable<Partial<Order>> = {}): NonNullable<Order> {
  return {
    ...{
      id: faker.number.int(),
      petId: faker.number.int(),
      quantity: faker.number.int(),
      shipDate: faker.date.anytime().toISOString(),
      status: faker.helpers.arrayElement<any>(['placed', 'approved', 'delivered']),
      complete: faker.datatype.boolean(),
    },
    ...data,
  }
}
