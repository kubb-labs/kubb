import { faker } from '@faker-js/faker'

export function pets(data: NonNullable<Partial<Pets>> = []) {
  return [...(faker.helpers.arrayElements([pet()]) as any), ...data]
}
