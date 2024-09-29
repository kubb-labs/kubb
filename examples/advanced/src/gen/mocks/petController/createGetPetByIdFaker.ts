import type { GetPetByIdPathParams } from '../../models/ts/petController/GetPetById.js'
import { createPetFaker } from '../createPetFaker.js'
import { faker } from '@faker-js/faker'

export function createGetPetByIdPathParamsFaker(data: NonNullable<Partial<GetPetByIdPathParams>> = {}) {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200Faker() {
  return createPetFaker()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404Faker() {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponseFaker() {
  return createPetFaker()
}
