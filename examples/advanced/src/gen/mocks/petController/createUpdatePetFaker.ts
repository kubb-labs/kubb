import type { UpdatePet202, UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePet200Faker() {
  return createPetFaker()
}

/**
 * @description accepted operation
 */
export function createUpdatePet202Faker(data?: Partial<UpdatePet202>) {
  return {
    ...{ id: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePet400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePet404Faker() {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePet405Faker() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetMutationRequestFaker() {
  return createPetFaker()
}

export function createUpdatePetMutationResponseFaker(data?: Partial<UpdatePetMutationResponse>) {
  return data || faker.helpers.arrayElement<any>([createUpdatePet200Faker(), createUpdatePet202Faker()])
}
