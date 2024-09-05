import type { DeletePetPathParams, DeletePetHeaderParams, DeletePet400, DeletePetMutationResponse } from '../../models/ts/petController/DeletePet'
import { faker } from '@faker-js/faker'

export function createDeletePetPathParams(data: NonNullable<Partial<DeletePetPathParams>> = {}): NonNullable<DeletePetPathParams> {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createDeletePetHeaderParams(data: NonNullable<Partial<DeletePetHeaderParams>> = {}): NonNullable<DeletePetHeaderParams> {
  return {
    ...{ api_key: faker.string.alpha() },
    ...data,
  }
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
