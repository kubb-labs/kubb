import RandExp from 'randexp'
import { faker } from '@faker-js/faker'

export function pet(data?: Partial<Pet>): Partial<Pet> {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      tag: faker.string.alpha(),
      code: new RandExp('\\b[1-9]\\b').gen(),
      shipDate: faker.date.anytime(),
      shipTime: faker.date.anytime(),
    },
    ...(data || {}),
  }
}
