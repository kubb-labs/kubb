import { faker } from '@faker-js/faker'
import type { AddPet200, AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet'
import { createAddPetRequest } from '../createAddPetRequest'
import { createPet } from '../createPet'

/**
 * @description Successful operation
 */
export function createAddPet200(override?: NonNullable<Partial<AddPet200>>): NonNullable<AddPet200> {
  return createPet(override)
}

export function createAddPet405(override: NonNullable<Partial<AddPet405>> = {}): NonNullable<AddPet405> {
  return {
    ...{ code: faker.number.int(), message: faker.string.alpha() },
    ...override,
  }
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetMutationRequest(override?: NonNullable<Partial<AddPetMutationRequest>>): NonNullable<AddPetMutationRequest> {
  return createAddPetRequest(override)
}

/**
 * @description Successful operation
 */
export function createAddPetMutationResponse(override?: NonNullable<Partial<AddPetMutationResponse>>): NonNullable<AddPetMutationResponse> {
  return createPet(override)
}
