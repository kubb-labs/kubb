import type { AddPet405, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function createAddPet405Faker(data?: Partial<AddPet405>): AddPet405 {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Successful operation
 */
export function createAddPetErrorFaker() {
  return createPetFaker()
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequestFaker() {
  return createAddPetRequestFaker()
}

export function createAddPetMutationResponseFaker(data?: Partial<AddPetMutationResponse>): AddPetMutationResponse {
  return undefined
}
