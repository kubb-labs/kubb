import type { GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/GetPetById.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createGetPetByIdPathParams(data?: Partial<GetPetByIdPathParams>): Partial<GetPetByIdPathParams> {
  faker.seed([220])
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200() {
  faker.seed([220])
  return createPet()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400() {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404() {
  faker.seed([220])
  return undefined
}

export function createGetPetByIdQueryResponse(data?: Partial<GetPetByIdQueryResponse>): Partial<GetPetByIdQueryResponse> {
  faker.seed([220])
  return data || faker.helpers.arrayElement<any>([createGetPetById200()])
}
