import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { UpdatePet400 } from '../../models/ts/petController/UpdatePet'
import { UpdatePet404 } from '../../models/ts/petController/UpdatePet'
import { UpdatePet405 } from '../../models/ts/petController/UpdatePet'
import { UpdatePetMutationRequest } from '../../models/ts/petController/UpdatePet'
import { UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet'

/**
 * @description Invalid ID supplied
 */

export function createUpdatePet400(): UpdatePet400 {
  return undefined
}

/**
 * @description Pet not found
 */

export function createUpdatePet404(): UpdatePet404 {
  return undefined
}

/**
 * @description Validation exception
 */

export function createUpdatePet405(): UpdatePet405 {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */

export function createUpdatePetMutationRequest(): UpdatePetMutationRequest {
  return createPet()
}

/**
 * @description Successful operation
 */

export function createUpdatePetMutationResponse(): UpdatePetMutationResponse {
  return createPet()
}
