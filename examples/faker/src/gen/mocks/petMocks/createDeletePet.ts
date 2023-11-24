import { faker } from '@faker-js/faker'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/DeletePet'

/**
 * @description Invalid pet value
 */

export function createDeletePet400(): NonNullable<DeletePet400> {
  return undefined
}

export function createDeletePetHeaderParams(): NonNullable<DeletePetHeaderParams> {
  return { api_key: faker.string.alpha() }
}

export function createDeletePetMutationResponse(): NonNullable<DeletePetMutationResponse> {
  return undefined
}

export function createDeletePetPathParams(): NonNullable<DeletePetPathParams> {
  return { petId: faker.number.float({}) }
}
