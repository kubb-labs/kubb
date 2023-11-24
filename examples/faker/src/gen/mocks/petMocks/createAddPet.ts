import { createPet } from '../createPet'
import { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet'

/**
 * @description Invalid input
 */

export function createAddPet405(): NonNullable<AddPet405> {
  return undefined
}
/**
 * @description Create a new pet in the store
 */

export function createAddPetMutationRequest(): NonNullable<AddPetMutationRequest> {
  return createPet()
}
/**
 * @description Successful operation
 */

export function createAddPetMutationResponse(): NonNullable<AddPetMutationResponse> {
  return createPet()
}
