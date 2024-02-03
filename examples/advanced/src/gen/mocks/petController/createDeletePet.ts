import { faker } from '@faker-js/faker'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/ts/petController/DeletePet'

/**
 * @description Invalid pet value
 */

export function createDeletePet400(override?: Partial<DeletePet400>): NonNullable<DeletePet400> {
  return undefined
}

export function createDeletePetHeaderParams(override: Partial<DeletePetHeaderParams> = {}): NonNullable<DeletePetHeaderParams> {
  return {
    ...{ 'api_key': faker.string.alpha() },
    ...override,
  }
}

export function createDeletePetMutationResponse(override?: Partial<DeletePetMutationResponse>): NonNullable<DeletePetMutationResponse> {
  return undefined
}

export function createDeletePetPathParams(override: Partial<DeletePetPathParams> = {}): NonNullable<DeletePetPathParams> {
  return {
    ...{ 'petId': faker.number.float({}) },
    ...override,
  }
}
