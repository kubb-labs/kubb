import type { DeletePetPathParams, DeletePetHeaderParams } from '../../models/ts/petController/DeletePet.ts'
import { faker } from '@faker-js/faker'

export function createDeletePetPathParamsFaker(data?: Partial<DeletePetPathParams>): Partial<DeletePetPathParams> {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createDeletePetHeaderParamsFaker(data?: Partial<DeletePetHeaderParams>): Partial<DeletePetHeaderParams> {
  return {
    ...{ api_key: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Invalid pet value
 */
export function createDeletePet400Faker() {
  return undefined
}

export function createDeletePetMutationResponseFaker() {
  return undefined
}
