import { faker } from '@faker-js/faker'
import type { Order } from '../models/Order'

export function createOrder(override: Partial<Order> = {}): NonNullable<Order> {
  return {
    ...{
      'id': faker.number.float({}),
      'petId': faker.number.float({}),
      'quantity': faker.number.float({}),
      'shipDate': faker.string.alpha(),
      'status': faker.helpers.arrayElement<any>([`placed`, `approved`, `delivered`]),
      'complete': faker.datatype.boolean(),
    },
    ...override,
  }
}
