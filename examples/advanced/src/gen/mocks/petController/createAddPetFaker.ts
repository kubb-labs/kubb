import { faker } from '@faker-js/faker'
import type { AddPet405, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'

/**
 * @description Successful operation
 */
export function createAddPet200Faker() {
  return createPetFaker()
}

/**
 * @description Pet not found
 */
export function createAddPet405Faker(data?: Partial<AddPet405>) {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequestFaker() {
  return createAddPetRequestFaker()
}

export function createAddPetMutationResponseFaker(data?: Partial<AddPetMutationResponse>) {
  return data || faker.helpers.arrayElement<any>([createAddPet200Faker()])
}
