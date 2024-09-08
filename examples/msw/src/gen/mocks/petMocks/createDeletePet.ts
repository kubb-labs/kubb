import type { DeletePetPathParams, DeletePetHeaderParams } from '../../models/DeletePet.ts'
import { faker } from '@faker-js/faker'

export function createDeletePetPathParams(data: NonNullable<Partial<DeletePetPathParams>> = {}) {
  faker.seed([220])
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createDeletePetHeaderParams(data: NonNullable<Partial<DeletePetHeaderParams>> = {}) {
  faker.seed([220])
  return {
    ...{ api_key: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid pet value
 */
export function createDeletePet400() {
  faker.seed([220])
  return undefined
}

export function createDeletePetMutationResponse() {
  faker.seed([220])
  return undefined
}
