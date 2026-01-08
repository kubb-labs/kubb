import { faker } from '@faker-js/faker'
import type { AddPetResponseData, AddPetStatus405 } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'

/**
 * @description Successful operation
 */
export function createAddPetStatus200Faker() {
  return createPetFaker()
}

/**
 * @description Pet not found
 */
export function createAddPetStatus405Faker(data?: Partial<AddPetStatus405>): AddPetStatus405 {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetRequestDataFaker() {
  return createAddPetRequestFaker()
}

export function createAddPetResponseDataFaker(data?: Partial<AddPetResponseData>): AddPetResponseData {
  return data || faker.helpers.arrayElement<any>([createAddPetStatus200Faker()])
}
