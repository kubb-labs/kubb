import type { Animal } from '../models/ts/Animal.ts'
import { createCatFaker } from './createCatFaker.ts'
import { createDogFaker } from './createDogFaker.ts'
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
