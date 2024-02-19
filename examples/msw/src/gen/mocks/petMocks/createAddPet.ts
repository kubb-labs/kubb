import { faker } from '@faker-js/faker'
import { createAddPetRequest } from '../createAddPetRequest'
import { createPet } from '../createPet'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet'

export function createAddPet405(override: NonNullable<Partial<AddPet405>> = {}): NonNullable<AddPet405> {
  return {
    ...{ 'code': faker.number.float({}), 'message': faker.string.alpha() },
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
