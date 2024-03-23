import { createPet } from '../createPet'
import type {
  UpdatePet200,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
} from '../../models/ts/petController/UpdatePet'

/**
 * @description Invalid ID supplied
 */
export function createUpdatePet400(override?: NonNullable<Partial<UpdatePet400>>): NonNullable<UpdatePet400> {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePet404(override?: NonNullable<Partial<UpdatePet404>>): NonNullable<UpdatePet404> {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePet405(override?: NonNullable<Partial<UpdatePet405>>): NonNullable<UpdatePet405> {
  return undefined
}

/**
 * @description Successful operation
 */
export function createUpdatePet200(override?: NonNullable<Partial<UpdatePet200>>): NonNullable<UpdatePet200> {
  return createPet(override)
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetMutationRequest(override?: NonNullable<Partial<UpdatePetMutationRequest>>): NonNullable<UpdatePetMutationRequest> {
  return createPet(override)
}

/**
 * @description Successful operation
 */
export function createUpdatePetMutationResponse(override?: NonNullable<Partial<UpdatePetMutationResponse>>): NonNullable<UpdatePetMutationResponse> {
  return createPet(override)
}
