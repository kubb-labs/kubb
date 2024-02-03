import { createPet } from '../createPet'
import type { UpdatePet400, UpdatePet404, UpdatePet405, UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet'

/**
 * @description Invalid ID supplied
 */

export function createUpdatePet400(override?: Partial<UpdatePet400>): NonNullable<UpdatePet400> {
  return undefined
}
/**
 * @description Pet not found
 */

export function createUpdatePet404(override?: Partial<UpdatePet404>): NonNullable<UpdatePet404> {
  return undefined
}
/**
 * @description Validation exception
 */

export function createUpdatePet405(override?: Partial<UpdatePet405>): NonNullable<UpdatePet405> {
  return undefined
}
/**
 * @description Update an existent pet in the store
 */

export function createUpdatePetMutationRequest(override?: Partial<UpdatePetMutationRequest>): NonNullable<UpdatePetMutationRequest> {
  return createPet(override)
}
/**
 * @description Successful operation
 */

export function createUpdatePetMutationResponse(override?: Partial<UpdatePetMutationResponse>): NonNullable<UpdatePetMutationResponse> {
  return createPet(override)
}
