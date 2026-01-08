import type { DeletePetPathParams, DeletePetHeaderParams, DeletePetResponseData } from '../../models/ts/petController/DeletePet.ts'
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
export function createDeletePetStatus400Faker() {
  return undefined
}

export function createDeletePetResponseDataFaker(data?: Partial<DeletePetResponseData>): DeletePetResponseData {
  return undefined
}
