import { faker } from '@faker-js/faker'

export function enumNamesType() {
  return faker.helpers.arrayElement<any>(['Pending', 'Received'])
}
