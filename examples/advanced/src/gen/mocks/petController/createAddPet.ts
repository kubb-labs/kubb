import type { AddPet200, AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet'
import { createAddPetRequest } from '../createAddPetRequest.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createAddPet200(): NonNullable<AddPet200> {
  return createPet()
}

/**
 * @description Pet not found
 */
export function createAddPet405(data: NonNullable<Partial<AddPet405>> = {}): NonNullable<AddPet405> {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequest(): NonNullable<AddPetMutationRequest> {
  return createAddPetRequest()
}

/**
 * @description Successful operation
 */
export function createAddPetMutationResponse(): NonNullable<AddPetMutationResponse> {
  return createPet()
}
