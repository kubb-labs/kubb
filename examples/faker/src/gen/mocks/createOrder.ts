import { faker } from '@faker-js/faker'

export function createOrder() {
  return {
    id: faker.number.float({}),
    petId: faker.number.float({}),
    quantity: faker.number.float({}),
    shipDate: faker.string.alpha({}),
    status: faker.helpers.arrayElement([[`placed`, `approved`, `delivered`]]),
    complete: faker.datatype.boolean({}),
  }
}
