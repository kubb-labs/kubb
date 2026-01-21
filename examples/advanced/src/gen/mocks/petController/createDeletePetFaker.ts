import { faker } from '@faker-js/faker'
import type { DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../../models/ts/petController/DeletePet.ts'

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

export function createDeletePetMutationResponseFaker(_data?: Partial<DeletePetMutationResponse>): DeletePetMutationResponse {
  return undefined
}
