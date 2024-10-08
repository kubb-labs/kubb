import type { AddPet405 } from '../../models/AddPet.ts'
import { createAddPetRequest } from '../createAddPetRequest.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createAddPet200() {
  faker.seed([220])
  return createPet()
}

/**
 * @description Pet not found
 */
export function createAddPet405(data: NonNullable<Partial<AddPet405>> = {}) {
  faker.seed([220])
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequest() {
  faker.seed([220])
  return createAddPetRequest()
}

/**
 * @description Successful operation
 */
export function createAddPetMutationResponse() {
  faker.seed([220])
  return createPet()
}
