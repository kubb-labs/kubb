import { createPet } from '../createPet'

import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/AddPet'

/**
 * @description Invalid input
 */

export function createAddPet405(): AddPet405 {
  return undefined
}

/**
 * @description Create a new pet in the store
 */

export function createAddPetMutationRequest(): AddPetMutationRequest {
  return createPet()
}

/**
 * @description Successful operation
 */

export function createAddPetMutationResponse(): AddPetMutationResponse {
  return createPet()
}
