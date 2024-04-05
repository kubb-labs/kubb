import { faker } from '@faker-js/faker'
import type { GetPetById200, GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById'
import { createPet } from '../createPet'

export function createGetPetByIdPathParams(override: NonNullable<Partial<GetPetByIdPathParams>> = {}): NonNullable<GetPetByIdPathParams> {
  return {
    ...{ petId: faker.number.int() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200(override?: NonNullable<Partial<GetPetById200>>): NonNullable<GetPetById200> {
  return createPet(override)
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400(): NonNullable<GetPetById400> {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404(): NonNullable<GetPetById404> {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse(override?: NonNullable<Partial<GetPetByIdQueryResponse>>): NonNullable<GetPetByIdQueryResponse> {
  return createPet(override)
}
