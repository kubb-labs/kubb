import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { GetPetById200, GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/GetPetById'

/**
 * @description Invalid ID supplied
 */

export function createGetPetById400(override?: NonNullable<Partial<GetPetById400>>): NonNullable<GetPetById400> {
  return undefined
}
/**
 * @description Pet not found
 */

export function createGetPetById404(override?: NonNullable<Partial<GetPetById404>>): NonNullable<GetPetById404> {
  return undefined
}

export function createGetPetByIdPathParams(override: NonNullable<Partial<GetPetByIdPathParams>> = {}): NonNullable<GetPetByIdPathParams> {
  return {
    ...{ 'petId': faker.number.int() },
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
 * @description successful operation
 */

export function createGetPetByIdQueryResponse(override?: NonNullable<Partial<GetPetByIdQueryResponse>>): NonNullable<GetPetByIdQueryResponse> {
  return createPet(override)
}
