import { faker } from '@faker-js/faker'
import type { UpdatePet200, UpdatePet400, UpdatePet404, UpdatePet405, UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../models/UpdatePet'
import { createPet } from '../createPet'

/**
 * @description Successful operation
 */
export function createUpdatePet200(override?: NonNullable<Partial<UpdatePet200>>): NonNullable<UpdatePet200> {
  faker.seed([220])
  return createPet(override)
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePet400(): NonNullable<UpdatePet400> {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePet404(): NonNullable<UpdatePet404> {
  faker.seed([220])
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePet405(): NonNullable<UpdatePet405> {
  faker.seed([220])
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetMutationRequest(override?: NonNullable<Partial<UpdatePetMutationRequest>>): NonNullable<UpdatePetMutationRequest> {
  faker.seed([220])
  return createPet(override)
}

/**
 * @description Successful operation
 */
export function createUpdatePetMutationResponse(override?: NonNullable<Partial<UpdatePetMutationResponse>>): NonNullable<UpdatePetMutationResponse> {
  faker.seed([220])
  return createPet(override)
}
