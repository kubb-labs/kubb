import { faker } from '@faker-js/faker'
import { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/DeletePet'

/**
 * @description Invalid pet value
 */
export function createDeletePet400(override?: NonNullable<Partial<DeletePet400>>): NonNullable<DeletePet400> {
  return undefined
}

export function createDeletePetHeaderParams(override: NonNullable<Partial<DeletePetHeaderParams>> = {}): NonNullable<DeletePetHeaderParams> {
  return {
    ...{ 'api_key': faker.string.alpha() },
    ...override,
  }
}

export function createDeletePetMutationResponse(override?: NonNullable<Partial<DeletePetMutationResponse>>): NonNullable<DeletePetMutationResponse> {
  return undefined
}

export function createDeletePetPathParams(override: NonNullable<Partial<DeletePetPathParams>> = {}): NonNullable<DeletePetPathParams> {
  return {
    ...{ 'petId': faker.number.int() },
    ...override,
  }
}
