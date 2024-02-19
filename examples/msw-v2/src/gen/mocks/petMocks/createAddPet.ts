import { faker } from '@faker-js/faker'
import { createAddPetRequest } from '../createAddPetRequest'
import { createPet } from '../createPet'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet'

export function createAddPet405(override: NonNullable<Partial<AddPet405>> = {}): NonNullable<AddPet405> {
  faker.seed([220])
  return {
    ...{ 'code': faker.number.float({}), 'message': faker.string.alpha() },
    ...override,
  }
}

/**
 * @description Create a new pet in the store
 */

export function createAddPetMutationRequest(override?: NonNullable<Partial<AddPetMutationRequest>>): NonNullable<AddPetMutationRequest> {
  faker.seed([220])
  return createAddPetRequest(override)
}

/**
 * @description Successful operation
 */

export function createAddPetMutationResponse(override?: NonNullable<Partial<AddPetMutationResponse>>): NonNullable<AddPetMutationResponse> {
  faker.seed([220])
  return createPet(override)
}
