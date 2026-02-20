import { faker } from '@faker-js/faker'
import type { GetPetById200, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById.ts'
import { createPetFaker } from '../createPetFaker.ts'

export function createGetPetByIdPathParamsFaker(data?: Partial<GetPetByIdPathParams>): GetPetByIdPathParams {
  return {
    ...{ petId: faker.number.bigInt() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200Faker(data?: Partial<GetPetById200>): GetPetById200 {
  return createPetFaker(data)
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404Faker() {
  return undefined
}

export function createGetPetByIdQueryResponseFaker(data?: Partial<GetPetByIdQueryResponse>): GetPetByIdQueryResponse {
  return data || faker.helpers.arrayElement<any>([createGetPetById200Faker()])
}
