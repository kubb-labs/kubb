import type { GetPetByIdPathParams } from '../../models/ts/petController/GetPetById.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createGetPetByIdPathParams(data: NonNullable<Partial<GetPetByIdPathParams>> = {}) {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200() {
  return createPet()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404() {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse() {
  return createPet()
}
