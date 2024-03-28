import { faker } from '@faker-js/faker'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/ts/petController/DeletePet'

export function createDeletePetPathParams(override: NonNullable<Partial<DeletePetPathParams>> = {}): NonNullable<DeletePetPathParams> {
  return {
    ...{ petId: faker.number.int() },
    ...override,
  }
}

export function createDeletePetHeaderParams(override: NonNullable<Partial<DeletePetHeaderParams>> = {}): NonNullable<DeletePetHeaderParams> {
  return {
    ...{ api_key: faker.string.alpha() },
    ...override,
  }
}

/**
 * @description Invalid pet value
 */
export function createDeletePet400(override?: NonNullable<Partial<DeletePet400>>): NonNullable<DeletePet400> {
  return undefined
}

export function createDeletePetMutationResponse(override?: NonNullable<Partial<DeletePetMutationResponse>>): NonNullable<DeletePetMutationResponse> {
  return undefined
}
