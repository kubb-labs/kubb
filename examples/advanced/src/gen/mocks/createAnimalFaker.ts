import { faker } from '@faker-js/faker'
import type { Animal } from '../models/ts/Animal.ts'
import { createCatFaker } from './createCatFaker.ts'
import { createDogFaker } from './createDogFaker.ts'

export function createAnimalFaker(data?: Partial<Animal>): Animal {
  return data || faker.helpers.arrayElement<any>([Object.assign({}, createCatFaker(), { type: 'cat' }), Object.assign({}, createDogFaker(), { type: 'dog' })])
}
