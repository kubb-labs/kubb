import { faker } from '@faker-js/faker'

export function pet(data?: Partial<Pet>) {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      tag: faker.string.alpha(),
      code: faker.helpers.fromRegExp(new RegExp('\\b[1-9]\\b')),
      shipDate: faker.date.anytime().toString(),
      shipTime: faker.date.anytime().toString(),
    },
    ...(data || {}),
  }
}
