import type { DeletePetPathParams, DeletePetHeaderParams, DeletePetMutationResponse } from '../../models/ts/petController/DeletePet.ts'
import { faker } from '@faker-js/faker'

export function createDeletePetPathParamsFaker(data?: Partial<DeletePetPathParams>): DeletePetPathParams {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createDeletePetHeaderParamsFaker(data?: Partial<DeletePetHeaderParams>): DeletePetHeaderParams {
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

export function createDeletePetMutationResponseFaker(data?: Partial<DeletePetMutationResponse>): DeletePetMutationResponse {
  return undefined
}
