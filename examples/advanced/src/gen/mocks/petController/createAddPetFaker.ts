import { faker } from '@faker-js/faker'
import type { AddPet405, AddPetError, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'
import { createPetFaker } from '../createPetFaker.ts'

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
export function createAddPetErrorFaker(data?: Partial<AddPetError>): AddPetError {
  return createPetFaker(data)
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequestFaker(data?: Partial<AddPetMutationRequest>): AddPetMutationRequest {
  return createAddPetRequestFaker(data)
}

export function createAddPetMutationResponseFaker(_data?: Partial<AddPetMutationResponse>): AddPetMutationResponse {
  return undefined
}
