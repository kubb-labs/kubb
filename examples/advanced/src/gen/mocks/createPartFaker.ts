import type { Part } from '../models/ts/Part.ts'
import { faker } from '@faker-js/faker'

export function createPartFaker(data?: Partial<Part>): Part {
  return {
    ...{
      urn: faker.string.alpha(),
      downloadedWelds: faker.helpers.multiple(() => faker.string.alpha()),
      simulatedWelds: faker.helpers.multiple(() => faker.string.alpha()),
      billedWeldCredits: faker.number.int(),
    },
    ...(data || {}),
  }
}
