import { createPet } from '../createPet'
import { UpdatePet400 } from '../../models/UpdatePet'
import { UpdatePet404 } from '../../models/UpdatePet'
import { UpdatePet405 } from '../../models/UpdatePet'
import { UpdatePetMutationRequest } from '../../models/UpdatePet'
import { UpdatePetMutationResponse } from '../../models/UpdatePet'

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
