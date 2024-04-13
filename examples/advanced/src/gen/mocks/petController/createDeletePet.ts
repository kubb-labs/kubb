import { faker } from '@faker-js/faker'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/ts/petController/DeletePet'

export function createDeletePetPathParams(): NonNullable<DeletePetPathParams> {
  return { petId: faker.number.int() }
}

export function createDeletePetHeaderParams(): NonNullable<DeletePetHeaderParams> {
  return { api_key: faker.string.alpha() }
}

/**
 * @description Invalid pet value
 */
export function createDeletePet400(): NonNullable<DeletePet400> {
  return undefined
}

export function createDeletePetMutationResponse(): NonNullable<DeletePetMutationResponse> {
  return undefined
}
