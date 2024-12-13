import { faker } from '@faker-js/faker'

export function pet(data?: Partial<Pet>) {
  return {
    ...{
      id: faker.string.fromCharacters('abc'),
      name: faker.string.alpha({ casing: 'lower' }),
      tag: faker.string.alpha(),
      code: faker.helpers.fromRegExp(new RegExp('\\b[1-9]\\b')),
      shipDate: faker.date.anytime(),
      shipTime: faker.date.anytime(),
    },
    ...(data || {}),
  }
}
