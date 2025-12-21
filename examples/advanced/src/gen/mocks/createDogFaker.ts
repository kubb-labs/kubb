import { faker } from '@faker-js/faker'
import type { Dog } from '../models/ts/Dog.ts'
import { createImageFaker } from './createImageFaker.ts'

export function createDogFaker(data?: Partial<Dog>): Dog {
  return {
    ...{ type: faker.string.alpha({ length: 1 }), name: faker.string.alpha(), image: createImageFaker() },
    ...(data || {}),
  }
}
