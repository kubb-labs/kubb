import type { GetPetByIdPathParams, GetPetById200, GetPetById400, GetPetById404, GetPetByIdQueryResponse } from '../../models/GetPetById.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

export function createGetPetByIdPathParams(data: NonNullable<Partial<GetPetByIdPathParams>> = {}): NonNullable<GetPetByIdPathParams> {
  faker.seed([220])
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200(): NonNullable<GetPetById200> {
  faker.seed([220])
  return createPet()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400(): NonNullable<GetPetById400> {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404(): NonNullable<GetPetById404> {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse(): NonNullable<GetPetByIdQueryResponse> {
  faker.seed([220])
  return createPet()
}
