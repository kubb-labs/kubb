import type { AddPet405 } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createAddPet200Faker() {
  return createPetFaker()
}

/**
 * @description Pet not found
 */
export function createAddPet405Faker(data: NonNullable<Partial<AddPet405>> = {}) {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequestFaker() {
  return createAddPetRequestFaker()
}

/**
 * @description Successful operation
 */
export function createAddPetMutationResponseFaker() {
  return createPetFaker()
}
