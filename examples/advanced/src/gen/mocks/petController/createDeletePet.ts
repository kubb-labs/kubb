import type { DeletePetPathParams, DeletePetHeaderParams } from '../../models/ts/petController/DeletePet.ts'
import { faker } from '@faker-js/faker'

export function createDeletePetPathParams(data: NonNullable<Partial<DeletePetPathParams>> = {}) {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createDeletePetHeaderParams(data: NonNullable<Partial<DeletePetHeaderParams>> = {}) {
  return {
    ...{ api_key: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid pet value
 */
export function createDeletePet400() {
  return undefined
}

export function createDeletePetMutationResponse() {
  return undefined
}
