import { faker } from '@faker-js/faker'

export function createApiResponse() {
  return { code: faker.number.float({}), type: faker.string.alpha({}), message: faker.string.alpha({}) }
}
