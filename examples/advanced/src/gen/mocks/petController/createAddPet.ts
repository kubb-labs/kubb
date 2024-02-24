import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import { createAddPetRequest } from '../createAddPetRequest'
import type { AddPet200, AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet'

export function createAddPet405(override: NonNullable<Partial<AddPet405>> = {}): NonNullable<AddPet405> {
  return {
    ...{ 'code': faker.number.float({}), 'message': faker.string.alpha() },
    ...override,
  }
}
/**
 * @description Successful operation
 */

export function createAddPet200(override?: NonNullable<Partial<AddPet200>>): NonNullable<AddPet200> {
  return createPet(override)
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
