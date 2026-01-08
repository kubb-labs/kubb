import type { UpdatePetStatus202, UpdatePetResponseData } from '../../models/ts/petController/UpdatePet.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200Faker() {
  return createPetFaker()
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202Faker(data?: Partial<UpdatePetStatus202>): UpdatePetStatus202 {
  return {
    ...{ id: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePetStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePetStatus404Faker() {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePetStatus405Faker() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetRequestDataFaker() {
  return createPetFaker()
}

export function createUpdatePetResponseDataFaker(data?: Partial<UpdatePetResponseData>): UpdatePetResponseData {
  return data || faker.helpers.arrayElement<any>([createUpdatePetStatus200Faker(), createUpdatePetStatus202Faker()])
}
