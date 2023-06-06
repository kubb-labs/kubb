import { createAddPetRequest } from './createAddPetRequest'
import { createPet } from './createPet'

import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../models/ts/petController/AddPet'

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
  return createAddPetRequest()
}

/**
 * @description Successful operation
 */

export function createAddPetMutationResponse(): AddPetMutationResponse {
  return createPet()
}
