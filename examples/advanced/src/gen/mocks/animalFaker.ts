import type { Animal } from '../models/ts/animal.ts'
import { createCatFaker } from './catFaker.ts'
import { createDogFaker } from './dogFaker.ts'
import { faker } from '@faker-js/faker'

export function createAnimalFaker(data?: Partial<Animal>): Animal {
  return (
    data ||
    faker.helpers.arrayElement<any>([
      { ...createCatFaker(), ...{ type: 'cat' } },
      { ...createDogFaker(), ...{ type: 'dog' } },
    ])
  )
}
