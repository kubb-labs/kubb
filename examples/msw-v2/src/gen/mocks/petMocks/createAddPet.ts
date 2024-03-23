import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import { AddPet200, AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet'
import { createAddPetRequest } from '../createAddPetRequest'

/**
 * @description Successful operation
 */
export function createAddPet200(override?: NonNullable<Partial<AddPet200>>): NonNullable<AddPet200> {
  faker.seed([220])
  return createPet(override)
}

export function createAddPet405(override: NonNullable<Partial<AddPet405>> = {}): NonNullable<AddPet405> {
  faker.seed([220])
  return {
    ...{ 'code': faker.number.int(), 'message': faker.string.alpha() },
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
