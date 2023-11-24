import { createPet } from './createPet'
import type { UpdatePet400, UpdatePet404, UpdatePet405, UpdatePetMutationRequest, UpdatePetMutationResponse } from '../models/UpdatePet'

/**
 * @description Invalid ID supplied
 */

export function createUpdatePet400(): NonNullable<UpdatePet400> {
  return undefined
}
/**
 * @description Pet not found
 */

export function createUpdatePet404(): NonNullable<UpdatePet404> {
  return undefined
}
/**
 * @description Validation exception
 */

export function createUpdatePet405(): NonNullable<UpdatePet405> {
  return undefined
}
/**
 * @description Update an existent pet in the store
 */

export function createUpdatePetMutationRequest(): NonNullable<UpdatePetMutationRequest> {
  return createPet()
}
/**
 * @description Successful operation
 */

export function createUpdatePetMutationResponse(): NonNullable<UpdatePetMutationResponse> {
  return createPet()
}
