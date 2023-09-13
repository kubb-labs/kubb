import { faker } from '@faker-js/faker'

import { Order } from '../models/Order'

export function createOrder(): Order {
  return {
    id: faker.number.float({}),
    petId: faker.number.float({}),
    quantity: faker.number.float({}),
    shipDate: faker.string.alpha(),
    status: faker.helpers.arrayElement<any>([`placed`, `approved`, `delivered`]),
    http_status: faker.helpers.arrayElement<any>([200, 400, 500]),
    complete: faker.datatype.boolean(),
  }
}
