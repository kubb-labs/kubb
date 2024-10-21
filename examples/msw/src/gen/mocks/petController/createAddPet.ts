import type { AddPet405, AddPetMutationResponse } from '../../models/AddPet.ts'
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
export function createAddPet405(data?: Partial<AddPet405>) {
  faker.seed([220])
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequest() {
  faker.seed([220])
  return createAddPetRequest()
}

export function createAddPetMutationResponse(data?: Partial<AddPetMutationResponse>) {
  faker.seed([220])
  return faker.helpers.arrayElement<any>([createAddPet200()]) || data
}
